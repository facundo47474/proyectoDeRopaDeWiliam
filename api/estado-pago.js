/**
 * api/estado-pago.js
 * Vercel Serverless Function — GET /api/estado-pago?orderId=...&paymentId=...
 *
 * Permite verificar y sincronizar de forma segura el estado de un pago
 * cuando el cliente regresa desde Mercado Pago (por si el webhook tarda unos segundos),
 * devolviendo un resumen público sin exponer PII innecesaria.
 */

const { getOrderDoc } = require('./_utils');
const { sincronizarPagoMercadoPago } = require('./_payment-sync');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const orderId = String(req.query?.orderId || '').trim();
    const paymentId = String(req.query?.paymentId || '').trim();

    if (!orderId) {
        return res.status(400).json({ error: 'Falta orderId' });
    }

    try {
        let order = null;

        if (paymentId && process.env.MP_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN.includes('0000000000000000')) {
            const synced = await sincronizarPagoMercadoPago(paymentId, { expectedOrderId: orderId });
            if (synced.ok && synced.order) {
                order = synced.order;
            }
        }

        if (!order) {
            const doc = await getOrderDoc(orderId);
            order = doc?.data || null;
        }

        if (!order) {
            return res.status(404).json({ ok: false, error: 'Orden no encontrada' });
        }

        return res.status(200).json({
            ok: true,
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            mpPaymentId: order.mpPaymentId || paymentId || '',
            subtotal: order.subtotal || 0,
            shippingCost: order.shippingCost || 0,
            total: order.total || 0,
            deliveryType: order.shipping?.deliveryType || 'home_delivery',
            zoneLabel: order.shipping?.zoneLabel || '',
            eta: order.shipping?.eta || '',
            city: order.shipping?.city || '',
            province: order.shipping?.province || ''
        });
    } catch (error) {
        console.error('[api/estado-pago] Error:', error);
        return res.status(500).json({ ok: false, error: 'No se pudo consultar el estado del pago.' });
    }
};

