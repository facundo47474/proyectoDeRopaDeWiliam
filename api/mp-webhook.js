/**
 * api/mp-webhook.js
 * Vercel Serverless Function — POST /api/mp-webhook
 *
 * Recibe notificaciones oficiales de Mercado Pago (Webhooks v2 / IPN),
 * verifica firma HMAC opcional, consulta el pago en la API oficial de MP
 * y actualiza la orden + stock en Firestore de forma idempotente.
 */

const { verifyMercadoPagoSignature, parseJsonBody } = require('./_utils');
const { sincronizarPagoMercadoPago } = require('./_payment-sync');

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        return res.status(200).json({ ok: true, service: 'urbanhustler-mp-webhook' });
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, GET');
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const body = await parseJsonBody(req);
        const query = req.query || {};

        const topic = String(
            query.type || query.topic || body.type || body.topic || ''
        ).toLowerCase();

        const paymentId = query['data.id'] || query.id || body?.data?.id;

        if ((topic && topic !== 'payment') || !paymentId) {
            return res.status(200).json({ received: true, ignored: true });
        }

        const secret = process.env.MP_WEBHOOK_SECRET;
        const xSignature = req.headers['x-signature'];
        const xRequestId = req.headers['x-request-id'];

        if (secret && xSignature) {
            const isValid = verifyMercadoPagoSignature({
                xSignature,
                xRequestId,
                dataId: query['data.id'] || paymentId,
                secret
            });
            if (!isValid) {
                console.warn('[api/mp-webhook] Firma HMAC inválida para paymentId:', paymentId);
                return res.status(401).json({ error: 'Firma webhook inválida' });
            }
        }

        const result = await sincronizarPagoMercadoPago(paymentId);

        return res.status(200).json({
            received: true,
            ...result,
            order: undefined
        });
    } catch (error) {
        console.error('[api/mp-webhook] Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

