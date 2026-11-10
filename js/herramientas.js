/**
 * HERRAMIENTAS Y UTILIDADES COMPARTIDAS
 * Funciones de formato, seguridad (anti-XSS), optimización de imágenes y carga de componentes.
 */

// 1. Escapar texto HTML para prevenir inyección de código (XSS)
window.escaparHTML = (texto) => {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// 2. Formatear precios en pesos argentinos ($XX.XXX)
window.formatearPrecio = (precio) => {
    const numero = Number(precio);
    if (isNaN(numero)) return '$0';
    return '$' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(numero);
};
window.formatPrice = window.formatearPrecio;

// 3. Optimizar URLs de imágenes alojadas en Cloudinary
window.optimizeCloudinary = (url, width = 800) => {
    if (!url || typeof url !== 'string') return '/recursos/imagenes/logo.jpeg';
    if (url.startsWith('/img.jpeg/')) {
        return url.replace('/img.jpeg/', '/recursos/imagenes/');
    }
    if (url.startsWith('../img.jpeg/')) {
        return url.replace('../img.jpeg/', '/recursos/imagenes/');
    }
    if (url.startsWith('/img/')) {
        return url.replace('/img/', '/recursos/imagenes/');
    }
    if (url.startsWith('../img/')) {
        return url.replace('../img/', '/recursos/imagenes/');
    }
    if (!url.includes('cloudinary.com')) return url;
    return url.includes('/upload/')
        ? url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${width},dpr_auto/`)
        : url;
};

// 4. Generar enlace consistente hacia la ficha de un producto
// Funciona tanto en servidor local (Live Server) como en producción (Vercel)
window.obtenerUrlProducto = (producto) => {
    if (!producto) return '/index.html';
    const idSeguro = encodeURIComponent(String(producto.id || ''));
    if (producto.slug) {
        return `/producto.html?id=${idSeguro}&producto=${encodeURIComponent(producto.slug)}`;
    }
    return `/producto.html?id=${idSeguro}`;
};

// 5. Cargador de fragmentos HTML reutilizables (barra, pie, carrusel, etc.)
class CargadorComponentes {
    static async loadComponent(containerId, sourcePath) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const response = await fetch(sourcePath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            container.innerHTML = await response.text();
        } catch (error) {
            console.error(`[CargadorComponentes] No se pudo cargar ${sourcePath}:`, error);
        }
    }
}

window.CargadorComponentes = CargadorComponentes;
window.UIComponentLoader = CargadorComponentes;

// 6. Motor Compartido de Envíos y Zonas (Argentina — Origen: Apóstoles, Misiones CP 3350)
window.PROVINCIAS_ARGENTINA = [
    'Misiones',
    'Corrientes',
    'Chaco',
    'Formosa',
    'Entre Ríos',
    'Santa Fe',
    'Buenos Aires',
    'Ciudad Autónoma de Buenos Aires (CABA)',
    'Córdoba',
    'Mendoza',
    'Tucumán',
    'Salta',
    'Jujuy',
    'Santiago del Estero',
    'Catamarca',
    'La Rioja',
    'San Juan',
    'San Luis',
    'La Pampa',
    'Neuquén',
    'Río Negro',
    'Chubut',
    'Santa Cruz',
    'Tierra del Fuego'
];

window.SHIPPING_DEFAULTS = {
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

window.normalizarShippingConfig = (raw) => {
    const src = raw && typeof raw === 'object' ? raw : {};
    const rawRates = src.rates && typeof src.rates === 'object' ? src.rates : {};
    const numOr = (val, fallback) => {
        const n = Number(val);
        return Number.isFinite(n) && n >= 0 ? n : fallback;
    };

    return {
        freeShippingEnabled: src.freeShippingEnabled !== false,
        freeShippingThreshold: numOr(src.freeShippingThreshold, window.SHIPPING_DEFAULTS.freeShippingThreshold),
        localPostalCode: String(src.localPostalCode || window.SHIPPING_DEFAULTS.localPostalCode).replace(/\D/g, '') || '3350',
        rates: {
            local: numOr(rawRates.local, window.SHIPPING_DEFAULTS.rates.local),
            zone1_nea_close: numOr(rawRates.zone1_nea_close, window.SHIPPING_DEFAULTS.rates.zone1_nea_close),
            zone2_litoral: numOr(rawRates.zone2_litoral, window.SHIPPING_DEFAULTS.rates.zone2_litoral),
            zone3_national: numOr(rawRates.zone3_national, window.SHIPPING_DEFAULTS.rates.zone3_national),
            zone4_patagonia: numOr(rawRates.zone4_patagonia, window.SHIPPING_DEFAULTS.rates.zone4_patagonia)
        }
    };
};

window.calcularPesoEstimado = (items) => {
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
};

window.calcularCostoEnvio = (shippingData, subtotal, items, rawConfig) => {
    const cfg = window.normalizarShippingConfig(rawConfig);
    const deliveryType = shippingData?.deliveryType === 'pickup' ? 'pickup' : 'home_delivery';
    const estimatedWeightKg = window.calcularPesoEstimado(items);

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

    if (!provNorm && !cpDigits) {
        return {
            ready: false,
            deliveryType: 'home_delivery',
            zoneId: 'pending',
            zoneLabel: 'Selecciona provincia y código postal para cotizar',
            eta: '',
            cost: freeByThreshold ? 0 : null,
            originalCost: null,
            isFree: freeByThreshold,
            freeReason: freeByThreshold ? 'threshold' : null,
            estimatedWeightKg
        };
    }

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
        ready: true,
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
};
