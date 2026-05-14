/**
 * api/sitemap.js
 * Vercel Serverless Function — Genera sitemap.xml dinámico con TODOS los productos.
 * 
 * Reemplaza el sitemap.xml estático (que solo tenía 2 URLs) con uno que
 * incluye automáticamente cada producto y categoría desde Firestore.
 * 
 * Google actualizará su índice cada vez que recrawlee este endpoint.
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ─── Inicializar Firebase Admin (una sola vez) ───────────────────────────────
function getDb() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'urbanhustler-15d31',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
    }
    return getFirestore();
}

module.exports = async (req, res) => {
    const BASE_URL = 'https://urbanhustler.vercel.app';
    const today = new Date().toISOString().split('T')[0];

    try {
        const db = getDb();
        const snapshot = await db.collection('products').get();
        const products = snapshot.docs.map(doc => doc.data());

        // Obtener categorías únicas
        const categories = [...new Set(
            products.map(p => p.category).filter(Boolean)
        )];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- PÁGINA PRINCIPAL -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- PÁGINAS DE CATEGORÍA -->`;

        categories.forEach(cat => {
            xml += `
  <url>
    <loc>${BASE_URL}/categoria/${encodeURIComponent(cat)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        xml += `

  <!-- PÁGINAS DE PRODUCTO -->`;

        let productCount = 0;
        products.forEach(p => {
            // Solo incluir productos con slug válido
            if (!p.slug || !p.name) return;
            productCount++;

            // Determinar fecha de última modificación (si está guardada, usarla)
            const lastmod = p.updatedAt
                ? new Date(p.updatedAt).toISOString().split('T')[0]
                : today;

            xml += `
  <url>
    <loc>${BASE_URL}/producto/${encodeURIComponent(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;

            // Incluir imagen principal (mejora el indexado en Google Images)
            if (p.image && p.image.startsWith('http')) {
                const safeImg = p.image.replace(/&/g, '&amp;');
                const safeName = (p.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                xml += `
    <image:image>
      <image:loc>${safeImg}</image:loc>
      <image:title>${safeName} — UrbanHustler</image:title>
      <image:caption>Compra ${safeName} en UrbanHustler. Streetwear y ropa urbana.</image:caption>
    </image:image>`;
            }

            xml += `
  </url>`;
        });

        xml += `

</urlset>`;

        console.log(`[api/sitemap] Generado: ${productCount} productos, ${categories.length} categorías`);

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        // Cache de 1 hora, revalida en background
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(xml);

    } catch (error) {
        console.error('[api/sitemap] Error al generar sitemap:', error.message);

        // Sitemap mínimo de fallback (para no devolver 500)
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(fallback);
    }
};
