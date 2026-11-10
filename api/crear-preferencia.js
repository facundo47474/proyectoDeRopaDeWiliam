/**
 * api/crear-preferencia.js
 * Vercel Serverless Function — POST /api/crear-preferencia
 *
 * 1. Valida datos del comprador, envío e ítems.
 * 2. Verifica stock y precios REALES contra Firestore (nunca confía en el cliente).
 * 3. Recalcula el costo de envío según settings/shipping y zonas/CP.
 * 4. Crea la preferencia en Mercado Pago Checkout Pro.
 * 5. Registra la orden previa en Firestore (orders/{orderId}) con paymentStatus: pending_payment.
 */

const {
    calcularEnvioServidor,
    getDocument,
    setDocument,
    getProductDoc,
    getBaseUrl,
    cleanString,
    parseJsonBody
} = require('./_utils');

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken || accessToken.includes('0000000000000000')) {
        return res.status(503).json({
            error: 'La pasarela de Mercado Pago aún no está configurada (falta MP_ACCESS_TOKEN).'
        });
    }

    try {
        const body = await parseJsonBody(req);
        const rawItems = Array.isArray(body.items) ? body.items : [];
        const rawBuyer = body.buyer && typeof body.buyer === 'object' ? body.buyer : {};
        const rawShipping = body.shipping && typeof body.shipping === 'object' ? body.shipping : {};

        if (rawItems.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }

        // 1. Validar datos del comprador
        const fullName = cleanString(rawBuyer.fullName, 100);
        const dni = String(rawBuyer.dni || '').replace(/\D/g, '');
        const phone = String(rawBuyer.phone || '').replace(/\D/g, '');
        const email = cleanString(rawBuyer.email, 120).toLowerCase();

        if (fullName.length < 3 || !fullName.includes(' ')) {
            return res.status(400).json({ error: 'Ingresa tu nombre y apellido completos.' });
        }
        if (dni.length < 7 || dni.length > 11) {
            return res.status(400).json({ error: 'Ingresa un DNI o CUIL válido (7 a 11 dígitos).' });
        }
        if (phone.length < 8 || phone.length > 15) {
            return res.status(400).json({ error: 'Ingresa un teléfono / WhatsApp válido.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Ingresa un email válido para recibir tu comprobante.' });
        }

        // 2. Validar datos de envío
        const deliveryType = rawShipping.deliveryType === 'pickup' ? 'pickup' : 'home_delivery';
        const shippingData = {
            deliveryType,
            province: cleanString(rawShipping.province, 80),
            postalCode: cleanString(rawShipping.postalCode, 12),
            city: cleanString(rawShipping.city, 80),
            streetName: cleanString(rawShipping.streetName, 100),
            streetNumber: cleanString(rawShipping.streetNumber, 20),
            apartment: cleanString(rawShipping.apartment, 60),
            reference: cleanString(rawShipping.reference, 140),
            trackingCode: ''
        };

        if (deliveryType === 'home_delivery') {
            if (!shippingData.province || !shippingData.postalCode || !shippingData.city || !shippingData.streetName || !shippingData.streetNumber) {
                return res.status(400).json({
                    error: 'Completa provincia, código postal, localidad, calle y altura para el envío.'
                });
            }
        } else {
            shippingData.province = 'Misiones';
            shippingData.postalCode = '3350';
            shippingData.city = 'Apóstoles';
            shippingData.streetName = 'San Lorenzo';
            shippingData.streetNumber = '19';
        }

        // 3. Consultar productos reales en Firestore y agregar cantidades por producto
        const productCache = new Map();
        const totalQtyByProduct = new Map();

        for (const reqItem of rawItems) {
            const prodId = cleanString(reqItem?.id, 80);
            const qty = Math.max(1, Math.min(50, parseInt(reqItem?.quantity, 10) || 1));
            if (!prodId) {
                return res.status(400).json({ error: 'Producto inválido en el carrito.' });
            }
            totalQtyByProduct.set(prodId, (totalQtyByProduct.get(prodId) || 0) + qty);

            if (!productCache.has(prodId)) {
                const prodDoc = await getProductDoc(prodId);
                if (!prodDoc || !prodDoc.data) {
                    return res.status(404).json({ error: `Una de las prendas seleccionadas ya no está disponible (ID: ${prodId}).` });
                }
                productCache.set(prodId, prodDoc.data);
            }
        }

        for (const [prodId, neededQty] of totalQtyByProduct.entries()) {
            const product = productCache.get(prodId);
            if (product.hidden === true) {
                return res.status(400).json({ error: `La prenda "${product.name}" ya no está disponible en la tienda.` });
            }
            const realStock = product.stock !== undefined ? parseInt(product.stock, 10) : 5;
            if (realStock < neededQty) {
                return res.status(400).json({
                    error: realStock <= 0
                        ? `"${product.name}" se encuentra agotado.`
                        : `Stock insuficiente para "${product.name}". Disponible: ${realStock} u.`
                });
            }
        }

        const baseUrl = getBaseUrl(req);
        const verifiedItems = [];
        let subtotal = 0;

        for (const reqItem of rawItems) {
            const prodId = cleanString(reqItem.id, 80);
            const product = productCache.get(prodId);
            const qty = Math.max(1, Math.min(50, parseInt(reqItem.quantity, 10) || 1));
            const size = cleanString(reqItem.size || 'U', 20) || 'U';
            const realPrice = Number(product.price);

            if (!Number.isFinite(realPrice) || realPrice <= 0) {
                return res.status(400).json({ error: `Precio inválido para "${product.name}".` });
            }

            subtotal += realPrice * qty;

            const rawImg = product.image || (Array.isArray(product.images) ? product.images[0] : '') || '';
            const resolvedImg = rawImg.startsWith('http')
                ? rawImg
                : (rawImg ? `${baseUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}` : `${baseUrl}/recursos/imagenes/logo.jpeg`);

            verifiedItems.push({
                id: String(product.id || prodId),
                name: product.name,
                category: product.category || 'Varios',
                size,
                quantity: qty,
                price: realPrice,
                image: resolvedImg
            });
        }

        // 4. Recalcular costo de envío en servidor según settings/shipping
        const shippingConfigDoc = await getDocument('settings', 'shipping').catch(() => null);
        const shippingCalc = calcularEnvioServidor(shippingData, subtotal, verifiedItems, shippingConfigDoc?.data);

        shippingData.zoneId = shippingCalc.zoneId;
        shippingData.zoneLabel = shippingCalc.zoneLabel;
        shippingData.eta = shippingCalc.eta;
        shippingData.estimatedWeightKg = shippingCalc.estimatedWeightKg;

        const shippingCost = Number(shippingCalc.cost || 0);
        const total = subtotal + shippingCost;
        const orderId = `UH-${Date.now()}`;

        // 5. Construir preferencia Mercado Pago Checkout Pro
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0] || fullName;
        const lastName = nameParts.slice(1).join(' ') || firstName;
        const streetNumDigits = parseInt(String(shippingData.streetNumber).replace(/\D/g, ''), 10);

        const mpItems = verifiedItems.map(item => ({
            id: item.id,
            title: `${item.name} (Talle ${item.size})`,
            category_id: 'fashion',
            quantity: item.quantity,
            currency_id: 'ARS',
            unit_price: item.price,
            picture_url: item.image
        }));

        const receiverAddress = deliveryType === 'home_delivery' ? {
            zip_code: shippingData.postalCode,
            street_name: shippingData.streetName,
            ...(Number.isFinite(streetNumDigits) && streetNumDigits > 0 ? { street_number: streetNumDigits } : {}),
            ...(shippingData.apartment ? { apartment: shippingData.apartment } : {}),
            city_name: shippingData.city,
            state_name: shippingData.province
        } : undefined;

        const shipmentsPayload = deliveryType === 'home_delivery'
            ? {
                mode: 'not_specified',
                cost: shippingCost,
                free_shipping: shippingCost === 0,
                receiver_address: receiverAddress
            }
            : {
                mode: 'not_specified',
                cost: 0,
                free_shipping: true
            };

        const backUrls = {
            success: `${baseUrl}/index.html?pago=exitoso&orden=${encodeURIComponent(orderId)}`,
            pending: `${baseUrl}/index.html?pago=pendiente&orden=${encodeURIComponent(orderId)}`,
            failure: `${baseUrl}/index.html?pago=fallido&orden=${encodeURIComponent(orderId)}`
        };

        const preferencePayload = {
            items: mpItems,
            payer: {
                name: firstName,
                surname: lastName,
                email,
                identification: {
                    type: dni.length === 11 ? 'CUIT' : 'DNI',
                    number: dni
                },
                phone: {
                    number: phone
                },
                ...(receiverAddress ? {
                    address: {
                        zip_code: shippingData.postalCode,
                        street_name: shippingData.streetName,
                        ...(Number.isFinite(streetNumDigits) && streetNumDigits > 0 ? { street_number: streetNumDigits } : {})
                    }
                } : {})
            },
            shipments: shipmentsPayload,
            external_reference: orderId,
            statement_descriptor: 'URBANHUSTLER',
            metadata: {
                order_id: orderId,
                delivery_type: deliveryType,
                zone_id: shippingCalc.zoneId
            },
            back_urls: backUrls,
            ...(backUrls.success.startsWith('https://') ? { auto_return: 'approved' } : {}),
            ...(baseUrl.startsWith('https://') ? { notification_url: `${baseUrl}/api/mp-webhook` } : {})
        };

        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferencePayload)
        });

        const mpData = await mpRes.json().catch(() => ({}));
        if (!mpRes.ok || !mpData.init_point) {
            console.error('[api/crear-preferencia] Error MP:', mpRes.status, mpData);
            return res.status(502).json({
                error: mpData.message || 'Mercado Pago rechazó la creación del pago. Intenta nuevamente.'
            });
        }

        // 6. Guardar la orden previa en Firestore
        const orderDoc = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'pending',
            paymentMethod: 'mercadopago',
            paymentStatus: 'pending_payment',
            shippingStatus: deliveryType === 'pickup' ? 'ready_pickup' : 'pending_dispatch',
            mpPreferenceId: String(mpData.id || ''),
            stockDeducted: false,
            subtotal,
            shippingCost,
            total,
            itemsCount: verifiedItems.reduce((acc, item) => acc + item.quantity, 0),
            customer: fullName,
            email,
            buyer: {
                fullName,
                dni,
                phone,
                email
            },
            shipping: shippingData,
            items: verifiedItems
        };

        await setDocument('orders', orderId, orderDoc, false);

        return res.status(200).json({
            ok: true,
            orderId,
            preferenceId: mpData.id,
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
            subtotal,
            shippingCost,
            total
        });
    } catch (error) {
        console.error('[api/crear-preferencia] Error:', error);
        return res.status(500).json({
            error: 'No pudimos iniciar el checkout en este momento. Por favor, intenta nuevamente en unos instantes.'
        });
    }
};

