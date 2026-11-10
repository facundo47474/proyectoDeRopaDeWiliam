/**
 * api/_payment-sync.js
 * Lógica compartida e idempotente para verificar un pago en Mercado Pago
 * y actualizar la orden + descontar stock en Firestore.
 */

const {
    getOrderDoc,
    getProductDoc,
    patchFieldsByDocName
} = require('./_utils');

async function sincronizarPagoMercadoPago(paymentId, { expectedOrderId = null } = {}) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN no configurado en el servidor.');
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (mpRes.status === 404) {
        return { ok: false, notFound: true, statusCode: 404 };
    }

    if (!mpRes.ok) {
        const text = await mpRes.text();
        throw new Error(`Error consultando pago MP (${mpRes.status}): ${text}`);
    }

    const payment = await mpRes.json();
    const orderId = String(payment.external_reference || '').trim();

    if (!orderId) {
        return { ok: false, ignored: true, reason: 'Pago sin external_reference' };
    }

    if (expectedOrderId && orderId !== String(expectedOrderId).trim()) {
        return { ok: false, mismatch: true, orderId };
    }

    const orderDoc = await getOrderDoc(orderId);
    if (!orderDoc || !orderDoc.data) {
        return { ok: false, orderNotFound: true, orderId };
    }

    const order = orderDoc.data;
    const mpStatus = String(payment.status || '').toLowerCase();
    const nowIso = new Date().toISOString();

    if (mpStatus === 'approved') {
        const alreadyDeducted = order.stockDeducted === true;

        if (!alreadyDeducted) {
            const qtyByProduct = new Map();
            for (const item of (order.items || [])) {
                const pid = String(item.id || '').trim();
                if (!pid) continue;
                const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
                qtyByProduct.set(pid, (qtyByProduct.get(pid) || 0) + qty);
            }

            for (const [prodId, totalQty] of qtyByProduct.entries()) {
                const prodDoc = await getProductDoc(prodId);
                if (prodDoc && prodDoc.data) {
                    const currentStock = prodDoc.data.stock !== undefined
                        ? parseInt(prodDoc.data.stock, 10)
                        : 0;
                    const newStock = Math.max(0, currentStock - totalQty);
                    await patchFieldsByDocName(prodDoc.name, {
                        stock: newStock,
                        updatedAt: nowIso
                    });
                }
            }
        }

        const updates = {
            status: 'approved',
            paymentStatus: 'paid',
            mpPaymentId: String(payment.id),
            mpStatus: payment.status,
            mpStatusDetail: payment.status_detail || '',
            mpPaymentType: payment.payment_type_id || '',
            mpPaymentMethod: payment.payment_method_id || '',
            approvedAt: order.approvedAt || nowIso,
            stockDeducted: true
        };

        await patchFieldsByDocName(orderDoc.name, updates);

        return {
            ok: true,
            orderId,
            status: 'approved',
            paymentStatus: 'paid',
            mpPaymentId: String(payment.id),
            alreadyProcessed: alreadyDeducted,
            order: { ...order, ...updates }
        };
    }

    if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) {
        const paymentStatus = (mpStatus === 'refunded' || mpStatus === 'charged_back')
            ? 'refunded'
            : 'rejected';

        const updates = {
            paymentStatus,
            mpPaymentId: String(payment.id),
            mpStatus: payment.status,
            mpStatusDetail: payment.status_detail || ''
        };

        if (paymentStatus === 'refunded') {
            updates.status = 'refunded';
        }

        await patchFieldsByDocName(orderDoc.name, updates);

        return {
            ok: true,
            orderId,
            status: updates.status || order.status || 'pending',
            paymentStatus,
            mpPaymentId: String(payment.id),
            order: { ...order, ...updates }
        };
    }

    // Estados intermedios: pending, in_process, authorized
    const updates = {
        paymentStatus: 'in_process',
        mpPaymentId: String(payment.id),
        mpStatus: payment.status || 'pending',
        mpStatusDetail: payment.status_detail || ''
    };

    await patchFieldsByDocName(orderDoc.name, updates);

    return {
        ok: true,
        orderId,
        status: order.status || 'pending',
        paymentStatus: 'in_process',
        mpPaymentId: String(payment.id),
        order: { ...order, ...updates }
    };
}

module.exports = { sincronizarPagoMercadoPago };

