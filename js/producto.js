/**
 * DETALLE DE PRODUCTO
 * Carga y muestra la ficha completa de una prenda, talles, stock y productos similares.
 * Soporta rutas ?id=, ?producto= y /producto/:slug.
 */

let currentProductDetails = null;
let currentSize = null;
let currentQuantity = 1;
let isProductLoaded = false;

function obtenerIdentificadorProducto() {
    const params = new URLSearchParams(window.location.search);
    let slug = params.get('producto');
    const id = params.get('id');

    // Soportar también rutas limpias /producto/nombre-del-producto
    if (!slug && window.location.pathname.startsWith('/producto/')) {
        const partes = window.location.pathname.split('/producto/');
        if (partes[1]) {
            slug = decodeURIComponent(partes[1].replace(/\/$/, ''));
        }
    }

    return { id, slug };
}

async function iniciarVistaDetalle() {
    mostrarPantallaCarga();
    await cargarDetalleProducto();

    document.addEventListener('firebase-ready', async () => {
        await cargarDetalleProducto();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarVistaDetalle);
} else {
    iniciarVistaDetalle();
}

async function obtenerTodosLosProductos() {
    let db = [];

    if (window.firebaseManager && window.firebaseManager.isInitialized) {
        try {
            const cloudProducts = await window.firebaseManager.getCollection('products');
            if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
                db = cloudProducts;
            }
        } catch (error) {
            console.error('❌ Error consultando Firebase:', error);
        }
    }

    if (db.length === 0) {
        try {
            const stored = localStorage.getItem('urbanHustlerProducts');
            if (stored) {
                db = JSON.parse(stored) || [];
            }
        } catch (error) {
            localStorage.removeItem('urbanHustlerProducts');
        }
    }

    return db.map(p => ({
        ...p,
        stock: p.stock !== undefined ? parseInt(p.stock, 10) : 5
    }));
}

async function cargarDetalleProducto() {
    try {
        const { id: productId, slug: productSlug } = obtenerIdentificadorProducto();

        if (!productSlug && !productId) {
            window.location.href = '/index.html';
            return;
        }

        const allProducts = await obtenerTodosLosProductos();

        if (allProducts.length === 0) {
            if (window.firebaseManager && !window.firebaseManager.isInitialized) {
                return; // Esperar a firebase-ready
            }
            mostrarEstadoError(productSlug || productId, 0);
            return;
        }

        const product = allProducts.find(p => {
            if (productId && String(p.id) === String(productId)) return true;
            if (productSlug && p.slug && String(p.slug) === String(productSlug)) return true;
            return false;
        });

        if (!product) {
            mostrarEstadoError(productSlug || productId, allProducts.length);
            return;
        }

        currentProductDetails = product;
        currentQuantity = 1;
        isProductLoaded = true;

        renderizarFichaProducto(product);
        renderizarProductosRelacionados(product, allProducts);
        actualizarMetadatosSEO(product);
        cargarPanelLateralSecciones();
    } catch (error) {
        console.error('❌ Error cargando detalle:', error);
        mostrarEstadoError('desconocido', 0);
    }
}

function actualizarMetadatosSEO(product) {
    const baseUrl = window.NEGOCIO?.urlSitio || 'https://urbanhustler.vercel.app';
    const productUrl = product.slug
        ? `${baseUrl}/producto/${product.slug}`
        : window.location.href;
    const description = product.description || `Compra ${product.name} en UrbanHustler. Lo mejor en ropa urbana.`;
    const categoryLabel = (product.category || 'ropa').toUpperCase();

    document.title = `${product.name} | UrbanHustler`;

    const breadcrumbCat = document.getElementById('breadcrumb-category');
    const breadcrumbProd = document.getElementById('breadcrumb-product');
    if (breadcrumbCat) {
        const catEncoded = encodeURIComponent(product.category || 'all');
        breadcrumbCat.innerHTML = `<a href="/index.html?category=${catEncoded}#productos-container" style="color:#888;text-decoration:none;">${window.escaparHTML(categoryLabel)}</a>`;
    }
    if (breadcrumbProd) {
        breadcrumbProd.textContent = product.name;
    }

    const oldProduct = document.getElementById('json-ld-product');
    if (oldProduct) oldProduct.remove();

    const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images : [product.image],
        description: description,
        sku: String(product.id),
        brand: { '@type': 'Brand', name: 'UrbanHustler' },
        offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'ARS',
            price: product.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: 'UrbanHustler' }
        }
    };

    const scriptProduct = document.createElement('script');
    scriptProduct.id = 'json-ld-product';
    scriptProduct.type = 'application/ld+json';
    scriptProduct.text = JSON.stringify(jsonLd);
    document.head.appendChild(scriptProduct);
}

function renderizarFichaProducto(product) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
    const images = rawImages.map(img => window.optimizeCloudinary(img, 1000));
    const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
    currentSize = sizes[0];

    const nombreSeguro = window.escaparHTML(product.name);
    const descSegura = window.escaparHTML(product.description || 'Sin descripción disponible.');
    const catSegura = window.escaparHTML((product.category || 'Varios').toUpperCase());
    const generoSeguro = window.escaparHTML((product.gender || 'Unisex').toUpperCase());

    const thumbnailsHtml = rawImages.map((img, index) => {
        const thumbUrl = window.escaparHTML(window.optimizeCloudinary(img, 150));
        const fullUrl = window.escaparHTML(window.optimizeCloudinary(img, 1000));
        return `
            <div class="thumb-item ${index === 0 ? 'active' : ''}" data-full="${fullUrl}" onclick="window.changeMainImage(this.dataset.full, this)">
                <img src="${thumbUrl}" width="80" height="80" alt="Vista ${index + 1}">
            </div>
        `;
    }).join('');

    const sizesHtml = sizes.map((size, index) => {
        const sizeSeguro = window.escaparHTML(size);
        return `<button class="size-btn ${index === 0 ? 'selected' : ''}" data-size="${sizeSeguro}" onclick="window.selectSize(this.dataset.size, this)">${sizeSeguro}</button>`;
    }).join('');

    container.innerHTML = `
        <div class="product-gallery">
            <div class="gallery-thumbs">${thumbnailsHtml}</div>
            <div class="gallery-main" style="position: relative;">
                <button class="btn-zoom" onclick="window.openZoomModal()" title="Ampliar imagen">
                    <i class="fa-solid fa-expand"></i>
                </button>
                <img id="main-image"
                     src="${window.escaparHTML(images[0])}"
                     width="600" height="800"
                     fetchpriority="high" loading="eager" decoding="sync"
                     alt="${nombreSeguro} — UrbanHustler ${catSegura}">
            </div>
        </div>

        <div class="detail-info">
            <div class="info-header">
                <span class="detail-category">${catSegura} // ${generoSeguro}</span>
                <h1 class="detail-title">${nombreSeguro}</h1>
                <div class="detail-price-row">
                    <span class="detail-price">${window.formatearPrecio(product.price)}</span>
                    <span class="stock-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}">${product.stock > 0 ? `EN STOCK (${product.stock})` : 'AGOTADO'}</span>
                </div>
            </div>

            <div class="detail-payment-box">
                <div class="payment-perk">
                    <i class="fa-solid fa-truck-fast"></i>
                    <span><strong>ENVÍOS A TODO EL PAÍS</strong> — Despacho rápido y seguro</span>
                </div>
                <div class="payment-perk">
                    <i class="fa-brands fa-whatsapp"></i>
                    <span><strong>ATENCIÓN DIRECTA</strong> — Coordiná tu pedido al instante</span>
                </div>
            </div>

            <p class="detail-description">${descSegura}</p>

            <div class="product-config">
                <div class="config-group">
                    <label>TALLE</label>
                    <div class="sizes-grid">${sizesHtml}</div>
                </div>

                <div class="config-group">
                    <label>CANTIDAD</label>
                    <div class="qty-selector" style="${product.stock <= 0 ? 'opacity: 0.5; pointer-events: none;' : ''}">
                        <button onclick="window.adjustQty(-1, ${Number(product.stock)})">−</button>
                        <input type="text" id="qty-display" value="1" readonly aria-label="Cantidad seleccionada">
                        <button onclick="window.adjustQty(1, ${Number(product.stock)})">+</button>
                    </div>
                </div>
            </div>

            <div class="detail-actions">
                <button class="btn-add-cart" onclick="window.addToCart()" ${product.stock <= 0 ? 'disabled style="background: #333; color: #777; cursor: not-allowed;"' : ''}>
                    ${product.stock > 0 ? 'AGREGAR AL CARRITO' : 'SIN STOCK'}
                </button>
            </div>
        </div>
    `;
}

function renderizarProductosRelacionados(currentProduct, allProducts) {
    const visibleProducts = allProducts.filter(p => p && p.hidden !== true);
    const related = visibleProducts.filter(p =>
        String(p.id) !== String(currentProduct.id) && p.category === currentProduct.category
    ).slice(0, 4);

    if (related.length < 4) {
        const others = visibleProducts.filter(p =>
            String(p.id) !== String(currentProduct.id) &&
            !related.some(r => String(r.id) === String(p.id))
        );
        related.push(...others.slice(0, 4 - related.length));
    }

    const container = document.getElementById('related-products-container');
    if (!container || related.length === 0) return;

    const cardsHtml = related.map(p => {
        const url = window.obtenerUrlProducto(p);
        const optimizedImg = window.escaparHTML(window.optimizeCloudinary(p.image, 550));
        const rawSecondary = Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : null;
        const secondaryImg = rawSecondary ? window.escaparHTML(window.optimizeCloudinary(rawSecondary, 550)) : null;
        const nombreSeguro = window.escaparHTML(p.name);
        const catSegura = window.escaparHTML((p.category || 'STREETWEAR').toUpperCase());
        const sizesList = Array.isArray(p.sizes) && p.sizes.length > 0
            ? p.sizes.map(s => window.escaparHTML(s)).join(' · ')
            : 'S · M · L · XL';

        return `
        <article class="product-card ${secondaryImg ? 'has-secondary' : ''}" onclick="window.location.href='${url}'">
            <div class="card-image">
                <div class="card-badges">
                    ${p.isOffer ? '<span class="card-badge badge-sale">SALE</span>' : ''}
                </div>
                <img class="card-img-primary" src="${optimizedImg}" alt="${nombreSeguro}" width="600" height="800" loading="lazy">
                ${secondaryImg ? `<img class="card-img-secondary" src="${secondaryImg}" alt="${nombreSeguro} vista alternativa" width="600" height="800" loading="lazy">` : ''}
                <div class="card-actions">
                    <span class="card-sizes-preview">${sizesList}</span>
                    <button type="button" class="btn-shop" onclick="event.stopPropagation(); window.location.href='${url}'">
                        VER PRENDA
                    </button>
                </div>
            </div>
            <div class="card-details">
                <span class="card-category">${catSegura}</span>
                <h3 class="card-title">${nombreSeguro}</h3>
                <div class="card-price-block">
                    <span class="price">${window.formatearPrecio(p.price)}</span>
                    <span class="price-sub">PRECIO ONLINE</span>
                </div>
            </div>
        </article>`;
    }).join('');

    container.innerHTML = `
        <section class="productos-section" style="padding-top: 3rem;">
            <div class="section-header-editorial">
                <span class="section-eyebrow">COMPLETÁ EL OUTFIT</span>
                <h3 class="section-title">RELACIONADOS</h3>
            </div>
            <div class="products-grid">${cardsHtml}</div>
        </section>
    `;
}

function mostrarEstadoError(id, count) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const idSeguro = window.escaparHTML(id);
    container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: #fff; grid-column: 1 / -1;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 4rem; color: #2ecc71; margin-bottom: 20px; display: block;"></i>
            <h2 style="font-size: 2rem; margin-bottom: 10px;">Producto no encontrado</h2>
            <p style="color: #999; margin-bottom: 10px;">No pudimos encontrar el producto solicitado (${idSeguro}).</p>
            <p style="font-size: 0.85rem; color: #666;">Productos activos en catálogo: ${Number(count)}</p>
            <button onclick="window.location.href='/index.html'" class="btn-shop" style="margin-top: 30px;">
                Volver al Inicio
            </button>
        </div>
    `;
}

function mostrarPantallaCarga() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px; gap: 20px; grid-column: 1 / -1;">
            <div class="spinner-loader" style="width: 60px; height: 60px; border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #2ecc71; border-radius: 50%; animation: spin-loader 1s linear infinite;"></div>
            <p style="color: #888; font-size: 16px; margin: 0;">Cargando producto...</p>
        </div>
        <style>@keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
}

window.changeMainImage = function (src, thumb) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) mainImage.src = src;
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
};

window.selectSize = function (size, btn) {
    currentSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
};

window.adjustQty = function (delta, maxStock) {
    const safeMaxStock = maxStock !== undefined && maxStock !== null ? parseInt(maxStock, 10) : 5;
    const newValue = currentQuantity + delta;

    if (newValue >= 1 && newValue <= Math.min(safeMaxStock, 10)) {
        currentQuantity = newValue;
        const qtyDisplay = document.getElementById('qty-display');
        if (qtyDisplay) qtyDisplay.value = currentQuantity;
    }
};

window.addToCart = function () {
    if (!window.cartManager || !currentProductDetails) return;
    window.cartManager.addItem(currentProductDetails, currentQuantity, currentSize);
};

window.openZoomModal = function () {
    const mainImg = document.getElementById('main-image');
    if (!mainImg) return;

    let zoomSrc = mainImg.src;
    if (zoomSrc.includes('cloudinary.com')) {
        zoomSrc = zoomSrc.replace(/q_auto:[^,]+|q_auto/, 'q_auto:best').replace(/w_\d+/, 'w_2000');
    }

    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="zoom-modal-content">
            <button class="zoom-close" onclick="this.closest('.zoom-modal').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <img src="${window.escaparHTML(zoomSrc)}" alt="Vista ampliada">
            <p style="color: #888; text-align: center; margin-top: 10px; font-size: 0.9rem;">
                Usa el gesto de pinza o desplazamiento para ver detalles
            </p>
        </div>
    `;
    document.body.appendChild(modal);
};

async function cargarPanelLateralSecciones() {
    if (!document.getElementById('filters-container')) return;
    await window.CargadorComponentes.loadComponent('filters-container', '/componentes/filtros.html');
    const closeBtn = document.getElementById('close-filters');
    const sidebar = document.getElementById('filters-sidebar');
    const overlay = document.getElementById('overlay');
    const cerrar = () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
    };
    closeBtn?.addEventListener('click', cerrar);
    overlay?.addEventListener('click', cerrar);
}

