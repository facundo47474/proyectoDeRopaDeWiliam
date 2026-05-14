/**
 * api/sitemap.js
 * Vercel Serverless Function — Genera sitemap.xml dinámico.
 */

const admin = require('firebase-admin');

function getDb() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID || 'urbanhustler-15d31',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : undefined,
            }),
        });
    }
    return admin.firestore();
}

module.exports = async (req, res) => {
    const BASE_URL = 'https://urbanhustler.vercel.app';
    const today = new Date().toISOString().split('T')[0];

    try {
        const db = getDb();
        const snapshot = await db.collection('products').get();
        const products = snapshot.docs.map(doc => doc.data());
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

        categories.forEach(cat => {
            xml += `
  <url>
    <loc>${BASE_URL}/categoria/${encodeURIComponent(cat)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        let count = 0;
        products.forEach(p => {
            if (!p.slug || !p.name) return;
            count++;
            const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today;
            xml += `
  <url>
    <loc>${BASE_URL}/producto/${encodeURIComponent(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>`;
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

        xml += `\n</urlset>`;

        console.log(`[api/sitemap] Generado: ${count} productos, ${categories.length} categorías`);

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(xml);

    } catch (error) {
        console.error('[api/sitemap] Error:', error.message);
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
