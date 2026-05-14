/**
 * api/sitemap.js
 * Vercel Serverless Function — Genera sitemap.xml dinámico.
 * 
 * USA: Firestore REST API (sin firebase-admin, sin dependencias)
 */

const FIREBASE_API_KEY = 'AIzaSyAG2an8MiIjLbIxGgJQn36Jf6zpT93fgYY';
const PROJECT_ID       = 'urbanhustler-15d31';
const FIRESTORE_BASE   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Parsear documento Firestore → objeto JS plano ────────────────────────
function parseValue(v) {
    if (!v) return null;
    if (v.stringValue  !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
    if (v.doubleValue  !== undefined) return v.doubleValue;
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.nullValue    !== undefined) return null;
    if (v.arrayValue)  return (v.arrayValue.values  || []).map(parseValue);
    if (v.mapValue)    return parseFields(v.mapValue.fields || {});
    return null;
}

function parseFields(fields) {
    const obj = {};
    for (const [k, v] of Object.entries(fields || {})) {
        obj[k] = parseValue(v);
    }
    return obj;
}

// ─── Obtener todos los productos via Firestore REST ───────────────────────
async function getAllProducts() {
    const url = `${FIRESTORE_BASE}/products?key=${FIREBASE_API_KEY}&pageSize=1000`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Firestore error: ${response.status}`);
    
    const data = await response.json();
    if (!data.documents) return [];
    
    return data.documents.map(doc => parseFields(doc.fields));
}

module.exports = async (req, res) => {
    const BASE_URL = 'https://urbanhustler.vercel.app';
    const today = new Date().toISOString().split('T')[0];

    try {
        const products = await getAllProducts();
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
