/**
 * api/_utils.js
 * Módulo compartido para las Serverless Functions de Vercel (Node 18+ sin dependencias).
 * - Autenticación OAuth2 Service Account para Firestore REST API (con fallback a API Key)
 * - Serialización / deserialización bidireccional Firestore
 * - Motor de cálculo de costos de envío y pesos estimados (paridad 1:1 con el frontend)
 */

const crypto = require('crypto');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAG2an8MiIjLbIxGgJQn36Jf6zpT93fgYY';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'urbanhustler-15d31';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

let cachedAccessToken = null;
let cachedTokenExpiryMs = 0;

// ─── Tarifario base por defecto (Apóstoles, Misiones CP 3350) ────────────────
const SHIPPING_DEFAULTS = {
    freeShippingEnabled: true,
    freeShippingThreshold: 120000,
    localPostalCode: '3350',
    rates: {
        local: 2500,
        zone1_nea_close: 6500,
        zone2_litoral: 8500,
        zone3_national: 10500,
        zone4_patagonia: 14500
    }
};

function normalizarTextoEnvio(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function normalizarShippingConfig(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const rawRates = src.rates && typeof src.rates === 'object' ? src.rates : {};
    const numOr = (val, fallback) => {
        const n = Number(val);
        return Number.isFinite(n) && n >= 0 ? n : fallback;
    };

    return {
        freeShippingEnabled: src.freeShippingEnabled !== false,
        freeShippingThreshold: numOr(src.freeShippingThreshold, SHIPPING_DEFAULTS.freeShippingThreshold),
        localPostalCode: String(src.localPostalCode || SHIPPING_DEFAULTS.localPostalCode).replace(/\D/g, '') || '3350',
        rates: {
            local: numOr(rawRates.local, SHIPPING_DEFAULTS.rates.local),
            zone1_nea_close: numOr(rawRates.zone1_nea_close, SHIPPING_DEFAULTS.rates.zone1_nea_close),
            zone2_litoral: numOr(rawRates.zone2_litoral, SHIPPING_DEFAULTS.rates.zone2_litoral),
            zone3_national: numOr(rawRates.zone3_national, SHIPPING_DEFAULTS.rates.zone3_national),
            zone4_patagonia: numOr(rawRates.zone4_patagonia, SHIPPING_DEFAULTS.rates.zone4_patagonia)
        }
    };
}

function calcularPesoEstimado(items) {
    let kg = 0;
    for (const item of (items || [])) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const cat = normalizarTextoEnvio(item.category || item.name || '');
        let unitKg = 0.4;
        if (cat.includes('tshirt') || cat.includes('remera') || cat.includes('tee') || cat.includes('musculosa')) {
            unitKg = 0.25;
        } else if (cat.includes('hoodie') || cat.includes('buzo') || cat.includes('campera') || cat.includes('sweater')) {
            unitKg = 0.65;
        } else if (cat.includes('pant') || cat.includes('jean') || cat.includes('cargo') || cat.includes('jogger')) {
            unitKg = 0.60;
        } else if (cat.includes('acces') || cat.includes('gorra') || cat.includes('cap') || cat.includes('media')) {
            unitKg = 0.20;
        }
        kg += unitKg * qty;
    }
    return Math.round(kg * 100) / 100;
}

function calcularEnvioServidor(shippingData, subtotal, items, rawConfig) {
    const cfg = normalizarShippingConfig(rawConfig);
    const deliveryType = shippingData?.deliveryType === 'pickup' ? 'pickup' : 'home_delivery';
    const estimatedWeightKg = calcularPesoEstimado(items);

    if (deliveryType === 'pickup') {
        return {
            ready: true,
            deliveryType: 'pickup',
            zoneId: 'pickup',
            zoneLabel: 'Retiro Gratis en Local (San Lorenzo 19, Apóstoles)',
            eta: 'En el día (Lunes a Sábado)',
            cost: 0,
            originalCost: 0,
            isFree: true,
            freeReason: 'pickup',
            estimatedWeightKg
        };
    }

    const cpDigits = String(shippingData?.postalCode || '').replace(/\D/g, '');
    const cpNum = cpDigits ? parseInt(cpDigits, 10) : 0;
    const provNorm = normalizarTextoEnvio(shippingData?.province);
    const freeByThreshold = cfg.freeShippingEnabled && Number(subtotal) >= cfg.freeShippingThreshold;

    let zoneId = 'zone3_national';
    let zoneLabel = 'Zona 3 - Nacional Estándar';
    let eta = '4 a 7 días hábiles';
    let baseCost = cfg.rates.zone3_national;

    if (cpDigits && cfg.localPostalCode && cpDigits === cfg.localPostalCode) {
        zoneId = 'local';
        zoneLabel = 'Zona 0 - Local Apóstoles';
        eta = 'En el día / 24 hs';
        baseCost = cfg.rates.local;
    } else if (
        provNorm.includes('misiones') ||
        provNorm.includes('corrientes') ||
        (cpNum >= 3300 && cpNum <= 3499)
    ) {
        zoneId = 'zone1_nea_close';
        zoneLabel = 'Zona 1 - Misiones y Corrientes';
        eta = '2 a 4 días hábiles';
        baseCost = cfg.rates.zone1_nea_close;
    } else if (
        provNorm.includes('chaco') ||
        provNorm.includes('formosa') ||
        provNorm.includes('entre rios') ||
        provNorm.includes('santa fe')
    ) {
        zoneId = 'zone2_litoral';
        zoneLabel = 'Zona 2 - NEA y Litoral';
        eta = '3 a 5 días hábiles';
        baseCost = cfg.rates.zone2_litoral;
    } else if (
        provNorm.includes('rio negro') ||
        provNorm.includes('neuquen') ||
        provNorm.includes('chubut') ||
        provNorm.includes('santa cruz') ||
        provNorm.includes('tierra del fuego') ||
        (cpNum >= 8300 && cpNum <= 9499)
    ) {
        zoneId = 'zone4_patagonia';
        zoneLabel = 'Zona 4 - Patagonia / Sur';
        eta = '6 a 10 días hábiles';
        baseCost = cfg.rates.zone4_patagonia;
    }

    return {
        ready: Boolean(provNorm || cpDigits),
        deliveryType: 'home_delivery',
        zoneId,
        zoneLabel,
        eta,
        cost: freeByThreshold ? 0 : baseCost,
        originalCost: baseCost,
        isFree: freeByThreshold,
        freeReason: freeByThreshold ? 'threshold' : null,
        estimatedWeightKg
    };
}

// ─── Conversión Firestore REST API <-> JS Plano ──────────────────────────────
function parseValue(v) {
    if (!v) return null;
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue !== undefined) return Number(v.doubleValue);
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.nullValue !== undefined) return null;
    if (v.arrayValue) return (v.arrayValue.values || []).map(parseValue);
    if (v.mapValue) return parseFields(v.mapValue.fields || {});
    return null;
}

function parseFields(fields) {
    const obj = {};
    for (const [k, v] of Object.entries(fields || {})) {
        obj[k] = parseValue(v);
    }
    return obj;
}

function toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
        if (!Number.isFinite(val)) return { integerValue: '0' };
        if (Number.isInteger(val)) return { integerValue: String(val) };
        return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    if (typeof val === 'object') {
        return { mapValue: { fields: toFirestoreFields(val) } };
    }
    return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj || {})) {
        if (v === undefined) continue;
        fields[k] = toFirestoreValue(v);
    }
    return fields;
}

// ─── Autenticación OAuth2 Service Account (JWT RS256 sin dependencias) ──────
function base64UrlEncode(input) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getServiceAccountAccessToken() {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!clientEmail || !rawKey || clientEmail.includes('xxxx') || rawKey.includes('tu clave aquí')) {
        return null;
    }

    const now = Date.now();
    if (cachedAccessToken && now < cachedTokenExpiryMs - 60000) {
        return cachedAccessToken;
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');
    const iat = Math.floor(now / 1000);
    const exp = iat + 3600;

    const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64UrlEncode(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat
    }));

    const signingInput = `${header}.${claim}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = base64UrlEncode(signer.sign(privateKey));
    const assertion = `${signingInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Error OAuth2 Firebase (${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    cachedAccessToken = tokenData.access_token;
    cachedTokenExpiryMs = now + (Number(tokenData.expires_in || 3600) * 1000);
    return cachedAccessToken;
}

async function firestoreRequest(relativeUrl, options = {}) {
    const token = await getServiceAccountAccessToken();
    const separator = relativeUrl.includes('?') ? '&' : '?';
    const url = token
        ? `${FIRESTORE_BASE}${relativeUrl}`
        : `${FIRESTORE_BASE}${relativeUrl}${separator}key=${FIREBASE_API_KEY}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
}

async function getDocument(collection, docId) {
    const res = await firestoreRequest(`/${collection}/${encodeURIComponent(String(docId))}`);
    if (res.status === 404) return null;
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore GET ${collection}/${docId} error (${res.status}): ${text}`);
    }
    const doc = await res.json();
    if (!doc || !doc.fields) return null;
    return { name: doc.name, data: parseFields(doc.fields) };
}

async function setDocument(collection, docId, data, merge = false) {
    const cleanData = {};
    for (const [k, v] of Object.entries(data || {})) {
        if (v !== undefined) cleanData[k] = v;
    }

    let query = '';
    if (merge) {
        const params = Object.keys(cleanData)
            .map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
            .join('&');
        query = params ? `?${params}` : '';
    }

    const res = await firestoreRequest(`/${collection}/${encodeURIComponent(String(docId))}${query}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: toFirestoreFields(cleanData) })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore PATCH ${collection}/${docId} error (${res.status}): ${text}`);
    }

    const doc = await res.json();
    return { name: doc.name, data: parseFields(doc.fields) };
}

async function patchFieldsByDocName(fullDocName, partialObj) {
    const marker = '/documents/';
    const idx = fullDocName.indexOf(marker);
    const relativePath = idx !== -1 ? fullDocName.slice(idx + marker.length - 1) : fullDocName;

    const cleanData = {};
    for (const [k, v] of Object.entries(partialObj || {})) {
        if (v !== undefined) cleanData[k] = v;
    }

    const params = Object.keys(cleanData)
        .map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
        .join('&');

    const res = await firestoreRequest(`${relativePath}?${params}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: toFirestoreFields(cleanData) })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore PATCH ${relativePath} error (${res.status}): ${text}`);
    }

    const doc = await res.json();
    return parseFields(doc.fields);
}

async function findDocumentByField(collection, fieldPath, value) {
    const candidates = [toFirestoreValue(value)];
    if (typeof value === 'string' && /^\d+$/.test(value)) {
        candidates.push({ integerValue: value });
    } else if (typeof value === 'number') {
        candidates.push({ stringValue: String(value) });
    }

    for (const firestoreVal of candidates) {
        const res = await firestoreRequest(`:runQuery`, {
            method: 'POST',
            body: JSON.stringify({
                structuredQuery: {
                    from: [{ collectionId: collection }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath },
                            op: 'EQUAL',
                            value: firestoreVal
                        }
                    },
                    limit: 1
                }
            })
        });

        if (!res.ok) continue;
        const rows = await res.json();
        const first = Array.isArray(rows) ? rows[0] : null;
        if (first && first.document && first.document.fields) {
            return {
                name: first.document.name,
                data: parseFields(first.document.fields)
            };
        }
    }

    return null;
}

async function getProductDoc(productId) {
    const direct = await getDocument('products', productId);
    if (direct) return direct;
    return findDocumentByField('products', 'id', String(productId));
}

async function getOrderDoc(orderId) {
    const direct = await getDocument('orders', orderId);
    if (direct) return direct;
    return findDocumentByField('orders', 'id', String(orderId));
}

// ─── Verificación Firma HMAC Webhook Mercado Pago ─────────────────────────────
function verifyMercadoPagoSignature({ xSignature, xRequestId, dataId, secret }) {
    if (!secret) return true;
    if (!xSignature || !dataId) return false;

    const parts = {};
    String(xSignature).split(',').forEach(segment => {
        const [k, v] = segment.split('=');
        if (k && v) parts[k.trim()] = v.trim();
    });

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    let manifest = '';
    if (dataId) manifest += `id:${String(dataId).toLowerCase()};`;
    if (xRequestId) manifest += `request-id:${String(xRequestId)};`;
    if (ts) manifest += `ts:${ts};`;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    const bufA = Buffer.from(expected, 'utf8');
    const bufB = Buffer.from(v1, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────
function getBaseUrl(req) {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();

    // En despliegues Preview de Vercel (ej. rama develop), usar el host real del preview
    // para que back_urls y webhooks regresen a la versión que se está probando.
    if (process.env.VERCEL_ENV === 'preview' && host) {
        return `${proto}://${host}`;
    }

    const envUrl = process.env.PUBLIC_SITE_URL;
    if (envUrl && envUrl.startsWith('http')) {
        return envUrl.replace(/\/$/, '');
    }

    return host ? `${proto}://${host}` : 'https://urbanhustler.vercel.app';
}

function cleanString(val, maxLen = 160) {
    return String(val ?? '')
        .replace(/[\r\n\t]+/g, ' ')
        .trim()
        .slice(0, maxLen);
}

async function parseJsonBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (e) {
            return {};
        }
    }
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            try {
                resolve(raw ? JSON.parse(raw) : {});
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', () => resolve({}));
    });
}

module.exports = {
    SHIPPING_DEFAULTS,
    normalizarShippingConfig,
    calcularPesoEstimado,
    calcularEnvioServidor,
    parseValue,
    parseFields,
    toFirestoreValue,
    toFirestoreFields,
    getDocument,
    setDocument,
    patchFieldsByDocName,
    getProductDoc,
    getOrderDoc,
    verifyMercadoPagoSignature,
    getBaseUrl,
    cleanString,
    parseJsonBody
};

