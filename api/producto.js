/**
 * api/producto.js
 * Vercel Serverless Function — SSR ligero para páginas de producto.
 *
 * PROPÓSITO SEO: Cuando Google visita /producto/[slug], esta función
 * lee el producto desde Firestore y sirve HTML con meta tags completos
 * ANTES de que el JavaScript del cliente se ejecute.
 */

const admin = require('firebase-admin');

// ─── Inicializar Firebase Admin (una sola vez) ───────────────────────────────
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

// ─── Helper: formatear precio argentino ─────────────────────────────────────
function formatPrice(price) {
    return '$' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(price);
}

// ─── Helper: escapar caracteres HTML ────────────────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ─── Generar el HTML completo del producto ──────────────────────────────────
function buildProductHTML(product, slug) {
    const BASE = 'https://urbanhustler.vercel.app';
    const productUrl = `${BASE}/producto/${slug}`;
    const title = `${esc(product.name)} | UrbanHustler`;
    const description = esc(
        product.description ||
        `Compra ${product.name} en UrbanHustler. Ropa urbana y streetwear de calidad premium con envío a todo Argentina.`
    );
    const image = product.image || `${BASE}/img.jpeg/logo.jpeg`;
    const price = product.price || 0;
    const inStock = product.stock === undefined || product.stock > 0;
    const cat = (product.category || 'ropa').toUpperCase();
    const gender = (product.gender || 'Unisex').toUpperCase();

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: (product.images && product.images.length > 0) ? product.images : [image],
        description: product.description || description,
        sku: String(product.id),
        brand: { '@type': 'Brand', name: 'UrbanHustler' },
        offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'ARS',
            price: price,
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: 'UrbanHustler' }
        }
    });

    const breadcrumbLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE + '/' },
            { '@type': 'ListItem', position: 2, name: cat, item: `${BASE}/categoria/${product.category || 'ropa'}` },
            { '@type': 'ListItem', position: 3, name: product.name }
        ]
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="author" content="UrbanHustler">
  <meta name="theme-color" content="#1A1A1A">
  <link rel="canonical" href="${productUrl}">

  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="UrbanHustler">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${esc(image)}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:url" content="${productUrl}">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="ARS">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${esc(image)}">

  <meta name="google-signin-client_id" content="543305563101-b2bln4jo9vil1b4c1ns5iq1k6m1fm8fc.apps.googleusercontent.com">

  <script type="application/ld+json">${jsonLd}</script>
  <script type="application/ld+json">${breadcrumbLd}</script>

  <link rel="icon" type="image/jpeg" href="/img.jpeg/logo.jpeg">
  <link rel="preload" as="image" href="${esc(image)}" fetchpriority="high">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preconnect" href="https://accounts.google.com">
  <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>

  <link rel="stylesheet" href="/CSS/index.css">
  <link rel="stylesheet" href="/CSS/detailProduct.css">
  <link rel="stylesheet" href="/CSS/productos.css">
  <link rel="stylesheet" href="/CSS/footer.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="/CSS/filters.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="/CSS/chatbot.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></noscript>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body class="detail-page">
  <noscript><p>Activa JavaScript para ver la tienda completa de UrbanHustler.</p></noscript>

  <div id="navbar-container"></div>

  <main class="detail-layout">
    <div style="grid-column:1/-1;padding:100px 5% 0 5%;">
      <button onclick="window.history.back()"
        style="background:transparent;border:1px solid #fff;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:0.9rem;transition:all 0.3s;"
        onmouseover="this.style.borderColor='#D90429';this.style.color='#D90429'"
        onmouseout="this.style.borderColor='#fff';this.style.color='#fff'">
        <i class="fa-solid fa-arrow-left"></i> Volver
      </button>
    </div>

    <nav aria-label="Ruta de navegación"
      style="grid-column:1/-1;padding:0 5%;font-size:0.85rem;color:#888;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <a href="/" style="color:#888;text-decoration:none;">Inicio</a>
      <span>›</span>
      <a href="/categoria/${esc(product.category || 'ropa')}" style="color:#888;text-decoration:none;">${esc(cat)}</a>
      <span>›</span>
      <span style="color:#fff;">${esc(product.name)}</span>
    </nav>

    <div id="filters-container"></div>

    <!-- Contenido pre-renderizado para SEO (Google lo lee sin ejecutar JS) -->
    <div id="product-detail-container" class="product-detail-container">
      <noscript>
        <div class="product-gallery">
          <div class="gallery-main">
            <img src="${esc(image)}"
              alt="${esc(product.name)} — UrbanHustler ${esc(cat)}"
              width="600" height="600" fetchpriority="high" loading="eager">
          </div>
        </div>
        <div class="detail-info">
          <div class="info-header">
            <span class="detail-category">${esc(cat)} &mdash; ${esc(gender)}</span>
            <h1 class="detail-title">${esc(product.name)}</h1>
            <div class="detail-price-row">
              <span class="detail-price">${formatPrice(price)}</span>
              <span style="color:${inStock ? '#2ecc71' : '#dc3545'}">${inStock ? 'En Stock' : 'Agotado'}</span>
            </div>
          </div>
          <p class="detail-description">${esc(product.description || '')}</p>
        </div>
      </noscript>
    </div>

    <div id="related-products-container" class="related-products-container"></div>
    <div id="lore-container"></div>
  </main>

  <div id="footer-container"></div>

  <script src="/JavaScript/data.js" defer></script>
  <script src="/JavaScript/navbar.js" defer></script>
  <script src="/JavaScript/cart.js" defer></script>
  <script src="/JavaScript/detailProduct.js" defer></script>
  <script src="/JavaScript/chatbot.js" defer></script>
</body>
</html>`;
}

// ─── Handler principal ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
    const slug = req.query.slug;

    if (!slug) {
        return res.redirect(301, '/');
    }

    try {
        const db = getDb();

        const snapshot = await db.collection('products')
            .where('slug', '==', slug)
            .limit(1)
            .get();

        if (snapshot.empty) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(404).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Producto no encontrado | UrbanHustler</title>
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="3;url=/">
  <link rel="stylesheet" href="/CSS/index.css">
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0D0D0D;color:#fff;font-family:system-ui,sans-serif;text-align:center;">
  <div>
    <h1 style="font-size:2rem;margin-bottom:1rem;">Producto no encontrado</h1>
    <p style="color:#888;">Redirigiendo a la tienda en 3 segundos...</p>
    <a href="/" style="color:#2ecc71;text-decoration:none;margin-top:1rem;display:block;">Volver al inicio →</a>
  </div>
</body>
</html>`);
        }

        const product = snapshot.docs[0].data();
        const html = buildProductHTML(product, slug);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        return res.status(200).send(html);

    } catch (error) {
        console.error('[api/producto] Error:', error.message);
        // Fallback: página funcional sin SSR (el JS del cliente cargará el producto)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>UrbanHustler — Producto</title>
<link rel="stylesheet" href="/CSS/index.css">
<link rel="stylesheet" href="/CSS/detailProduct.css">
<link rel="stylesheet" href="/CSS/productos.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
<script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body class="detail-page">
<div id="navbar-container"></div>
<main class="detail-layout">
  <div style="grid-column:1/-1;padding:100px 5% 0 5%;">
    <button onclick="window.history.back()" style="background:transparent;border:1px solid #fff;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:8px;">
      <i class="fa-solid fa-arrow-left"></i> Volver
    </button>
  </div>
  <div id="filters-container"></div>
  <div id="product-detail-container" class="product-detail-container"></div>
  <div id="related-products-container" class="related-products-container"></div>
  <div id="lore-container"></div>
</main>
<div id="footer-container"></div>
<script src="/JavaScript/data.js" defer></script>
<script src="/JavaScript/navbar.js" defer></script>
<script src="/JavaScript/cart.js" defer></script>
<script src="/JavaScript/detailProduct.js" defer></script>
<script src="/JavaScript/chatbot.js" defer></script>
</body></html>`);
    }
};
