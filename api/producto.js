/**
 * api/producto.js
 * Vercel Serverless Function — SSR ligero para páginas de producto.
 * 
 * PROPÓSITO SEO: Cuando Google visita /producto/[slug], esta función
 * lee el producto desde Firestore y sirve HTML con meta tags completos
 * ANTES de que el JavaScript del cliente se ejecute.
 * 
 * Resultado: Google puede indexar título, descripción e imagen del producto.
 */

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

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

// ─── Helper: formatear precio argentino ─────────────────────────────────────
function formatPrice(price) {
    return '$' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(price);
}

// ─── Helper: escapar caracteres HTML ────────────────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ─── Generar el HTML completo del producto ──────────────────────────────────
function buildProductHTML(product, slug) {
    const baseUrl = 'https://urbanhustler.vercel.app';
    const productUrl = `${baseUrl}/producto/${slug}`;
    const title = `${escHtml(product.name)} | UrbanHustler`;
    const description = escHtml(
        product.description ||
        `Compra ${product.name} en UrbanHustler. Ropa urbana y streetwear de calidad premium con envío a todo Argentina.`
    );
    const image = product.image || `${baseUrl}/img.jpeg/logo.jpeg`;
    const price = product.price || 0;
    const inStock = (product.stock === undefined || product.stock > 0);
    const categoryLabel = (product.category || 'Ropa').toUpperCase();
    const genderLabel = (product.gender || 'Unisex').toUpperCase();

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images : [image],
        description: product.description || description,
        sku: String(product.id),
        brand: { '@type': 'Brand', name: 'UrbanHustler' },
        offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'ARS',
            price: price,
            availability: inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@type': 'Organization', name: 'UrbanHustler' }
        }
    });

    const breadcrumbJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl + '/' },
            { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${baseUrl}/categoria/${product.category || 'ropa'}` },
            { '@type': 'ListItem', position: 3, name: product.name }
        ]
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- SEO Primary -->
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="author" content="UrbanHustler">
  <meta name="theme-color" content="#1A1A1A">
  <link rel="canonical" href="${productUrl}">

  <!-- Open Graph (Facebook, WhatsApp, etc.) -->
  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="UrbanHustler">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${escHtml(image)}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:url" content="${productUrl}">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="ARS">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escHtml(image)}">

  <!-- Google Sign-In -->
  <meta name="google-signin-client_id" content="543305563101-b2bln4jo9vil1b4c1ns5iq1k6m1fm8fc.apps.googleusercontent.com">

  <!-- Datos Estructurados: Producto -->
  <script type="application/ld+json">${jsonLd}</script>

  <!-- Datos Estructurados: Breadcrumb -->
  <script type="application/ld+json">${breadcrumbJsonLd}</script>

  <!-- Preconnects de rendimiento -->
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preconnect" href="https://accounts.google.com">
  <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
  <link rel="dns-prefetch" href="https://www.gstatic.com">

  <!-- Favicon -->
  <link rel="icon" type="image/jpeg" href="/img.jpeg/logo.jpeg">

  <!-- Preload imagen LCP (imagen principal del producto) -->
  <link rel="preload" as="image" href="${escHtml(image)}" fetchpriority="high">

  <!-- Estilos -->
  <link rel="stylesheet" href="/CSS/index.css">
  <link rel="stylesheet" href="/CSS/detailProduct.css">
  <link rel="stylesheet" href="/CSS/productos.css">
  <link rel="stylesheet" href="/CSS/footer.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="/CSS/filters.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="/CSS/chatbot.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" media="print" onload="this.media='all'">
  <noscript>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  </noscript>

  <!-- Google Sign-In SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body class="detail-page">
  <noscript>
    <p>Activa JavaScript para ver la tienda completa de UrbanHustler.</p>
  </noscript>

  <!-- Navbar -->
  <div id="navbar-container"></div>

  <main class="detail-layout">

    <!-- Botón volver -->
    <div style="grid-column: 1 / -1; padding: 100px 5% 0 5%;">
      <button onclick="window.history.back()"
        style="background:transparent;border:1px solid #fff;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:0.9rem;transition:all 0.3s;"
        onmouseover="this.style.borderColor='#D90429';this.style.color='#D90429'"
        onmouseout="this.style.borderColor='#fff';this.style.color='#fff'">
        <i class="fa-solid fa-arrow-left"></i> Volver
      </button>
    </div>

    <!-- Breadcrumb visible (SEO + UX) -->
    <nav aria-label="Ruta de navegación"
      style="grid-column:1/-1;padding:0 5%;font-size:0.85rem;color:#888;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
      <a href="/" style="color:#888;text-decoration:none;">Inicio</a>
      <span>›</span>
      <a href="/categoria/${escHtml(product.category || 'ropa')}" style="color:#888;text-decoration:none;">${escHtml(categoryLabel)}</a>
      <span>›</span>
      <span style="color:#fff;">${escHtml(product.name)}</span>
    </nav>

    <!-- Filtros -->
    <div id="filters-container"></div>

    <!-- CONTENIDO PRE-RENDERIZADO PARA SEO (Google lo lee sin JS) -->
    <div id="product-detail-container" class="product-detail-container">
      <noscript>
        <!-- Versión estática para bots sin JS -->
        <div class="product-gallery">
          <div class="gallery-main">
            <img src="${escHtml(image)}"
              alt="${escHtml(product.name)} — UrbanHustler streetwear ${escHtml(categoryLabel)}"
              width="600" height="600" fetchpriority="high" loading="eager">
          </div>
        </div>
        <div class="detail-info">
          <div class="info-header">
            <span class="detail-category">${escHtml(categoryLabel)} &mdash; ${escHtml(genderLabel)}</span>
            <h1 class="detail-title">${escHtml(product.name)}</h1>
            <div class="detail-price-row">
              <span class="detail-price">${formatPrice(price)}</span>
              <span style="color:${inStock ? '#2ecc71' : '#dc3545'}">${inStock ? 'En Stock' : 'Agotado'}</span>
            </div>
          </div>
          <p class="detail-description">${escHtml(product.description || '')}</p>
        </div>
      </noscript>
    </div>

    <div id="related-products-container" class="related-products-container"></div>
    <div id="lore-container"></div>
  </main>

  <!-- Footer -->
  <div id="footer-container"></div>

  <!-- Scripts (mismo orden que detailProduct.html original) -->
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
    const { slug } = req.query;

    if (!slug) {
        return res.redirect(301, '/');
    }

    try {
        const db = getDb();

        // Buscar producto por slug en Firestore
        const snapshot = await db.collection('products')
            .where('slug', '==', slug)
            .limit(1)
            .get();

        if (snapshot.empty) {
            // Producto no encontrado — redirigir a home con 404 suave
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
    <p style="color:#888;">Te redirigimos a la tienda en 3 segundos...</p>
    <a href="/" style="color:#2ecc71;text-decoration:none;margin-top:1rem;display:block;">Volver al inicio</a>
  </div>
</body>
</html>`);
        }

        const product = snapshot.docs[0].data();
        const html = buildProductHTML(product, slug);

        // Cache de 1 hora en CDN, revalidar en background (stale-while-revalidate)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-Robots-Tag', 'index, follow');
        return res.status(200).send(html);

    } catch (error) {
        console.error('[api/producto] Error:', error.message);

        // Fallback: servir la página dinámica sin meta tags (mejor que un 500)
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
    <button onclick="window.history.back()" style="background:transparent;border:1px solid #fff;color:#fff;padding:8px 16px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:0.9rem;">
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
