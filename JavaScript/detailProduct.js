/**
 * DETALLE DE PRODUCTO
 * Gestiona la carga, renderizado e interacción del detalle de un producto específico
 */

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

const startDetailProcess = async () => {
    console.log("🚀 [Detail] Iniciando vista de producto...");
    showLoadingScreen();

    // 1. Asegurar que MOCK_DB esté disponible
    if (typeof MOCK_DB === 'undefined' && !window.MOCK_DB) {
        console.warn("⚠️ MOCK_DB no encontrado, cargando data.js...");
        await new Promise(resolve => {
            const script = document.createElement('script');
            script.src = '../JavaScript/data.js';
            script.onload = resolve;
            script.onerror = resolve; // Continuar aunque falle
            document.head.appendChild(script);
        });
    }

    // 2. Iniciar lógica principal
    await initDetailProduct();

    // 3. Recarga reactiva si Firebase se conecta después
    document.addEventListener('firebase-ready', async () => {
        console.log("🔄 Actualizando detalle con datos de la nube...");
        await initDetailProduct();
    });
};

// Asegurar que la inicialización ocurra incluso si el evento DOMContentLoaded ya pasó
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDetailProcess);
} else {
    startDetailProcess();
}

// ============================================
// VARIABLES DE ESTADO
// ============================================

let currentProductDetails = null;
let currentSize = null;
let currentQuantity = 1;
let isProductLoaded = false;
let allRelatedProducts = [];
let relatedFilters = {
    category: 'all',
    maxPrice: 1000000
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function initDetailProduct() {
    try {
        // 1. Obtener ID de la URL
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            console.error("❌ No se proporcionó ID de producto");
            window.location.href = 'index.html';
            return;
        }

        console.log("🔍 [Detail] Buscando producto con ID:", productId);

        // 2. Obtener todas las fuentes de data
        const allProducts = await fetchAllProducts();

        if (allProducts.length === 0) {
            // FIX: Si Firebase aún se está conectando, no mostrar error todavía.
            // Mantener el spinner de carga hasta que dispare el evento 'firebase-ready'.
            if (window.firebaseManager && !window.firebaseManager.isInitialized) {
                console.log("⏳ Firebase cargando. Esperando datos...");
                return;
            }
            console.error("❌ No hay productos disponibles");
            renderErrorState(productId, 0);
            return;
        }

        // 3. Convertir ambos a strings para comparación consistente
        const product = allProducts.find(p => String(p.id) === String(productId));

        if (!product) {
            console.error("❌ Producto no encontrado. ID buscado:", productId);
            await new Promise(r => setTimeout(r, 1500)); // Espera elegante
            renderErrorState(productId, allProducts.length);
            return;
        }

        console.log("✅ [Detail] Producto encontrado:", product.name);
        currentProductDetails = product;
        isProductLoaded = true;

        // 4. Renderizar componentes en orden
        renderProductDetail(product);
        renderRelatedProducts(product, allProducts);

        // 5. Cargar componentes externos (no-blocking)
        loadExternalComponents();

    } catch (error) {
        console.error("❌ Error en initDetailProduct:", error);
        renderErrorState('UNKNOWN', 0);
    }
}

// ============================================
// GESTIÓN DE DATOS
// ============================================

async function fetchAllProducts() {
    let db = [];

    // ESTRATEGIA: Usar los MISMOS productos que se muestran en la home
    // 1. Firebase primero (si tiene datos válidos)
    // 2. localStorage (si tiene datos válidos)
    // 3. MOCK_DB como fallback si todo lo demás falla

    // 1. Intentar Firebase primero
    if (window.firebaseManager && window.firebaseManager.isInitialized) {
        try {
            console.log("🔍 Intentando obtener de Firebase...");
            const cloudProducts = await window.firebaseManager.getCollection('products');

            if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
                // La fuente de la verdad es la nube, aceptamos todos los productos.
                console.log("✅ Firebase:", cloudProducts.length, "productos");
                db = cloudProducts;

                // OPTIMIZACIÓN: No guardar en localStorage para evitar errores de cuota (QuotaExceededError)
                // El detalle del producto usará los datos frescos de la nube.
            }
        } catch (error) {
            console.error("❌ Error en Firebase:", error);
        }
    }

    // 2. Si Firebase no funcionó, intentar localStorage
    if (db.length === 0) {
        try {
            const stored = localStorage.getItem('urbanHustlerProducts');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Aceptamos los datos de localStorage como válidos.
                console.log("✅ localStorage:", parsed.length, "productos válidos");
                db = parsed;
            }
        } catch (error) {
            console.error("❌ Error parseando localStorage");
            localStorage.removeItem('urbanHustlerProducts');
        }
    }

    // 3. Si todo lo demás falla, se retorna un array vacío.
    if (db.length === 0) {
        if (window.firebaseManager && !window.firebaseManager.isInitialized) {
            console.log("⏳ Caché local vacía. Esperando conexión a Nube...");
        } else {
            console.error("❌ No hay productos disponibles de ninguna fuente (Nube/Local)");
        }
    }

    console.log("📊 Base de datos final:", db.length, "productos");
    console.log("📋 IDs disponibles:", db.slice(0, 10).map(p => ({ id: p.id, name: p.name })), db.length > 10 ? `... y ${db.length - 10} más` : '');

    return db.map(p => ({
        ...p,
        stock: (p.stock !== undefined) ? parseInt(p.stock) : 5
    }));
}

// ============================================
// RENDERIZADO
// ============================================

function renderProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    if (!container) {
        console.error("❌ Contenedor 'product-detail-container' no encontrado");
        return;
    }

    // Preparar datos
    const rawImages = (product.images && product.images.length > 0)
        ? product.images
        : [product.image];
    
    // Optimizar todas las imágenes para Cloudinary
    const images = rawImages.map(img => window.optimizeCloudinary(img, 1000));

    const sizes = (product.sizes && product.sizes.length > 0)
        ? product.sizes
        : ['S', 'M', 'L', 'XL'];

    currentSize = sizes[0];

    // HTML Miniaturas
    const thumbnailsHtml = rawImages.map((img, index) => `
          <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="window.changeMainImage('${img}', this)">
            <img src="${window.optimizeCloudinary(img, 150)}" width="80" height="80" alt="thumbnail">
        </div>
    `).join('');

    // HTML Talles
    const sizesHtml = sizes.map((size, index) => `
        <button class="size-btn ${index === 0 ? 'selected' : ''}" onclick="window.selectSize('${size}', this)">${size}</button>
    `).join('');

    // HTML Principal
    container.innerHTML = `
        <div class="product-gallery">
            <div class="gallery-thumbs">${thumbnailsHtml}</div>
            <div class="gallery-main" style="position: relative;">
                <button class="btn-zoom" onclick="window.openZoomModal()" title="Ver texturas en detalle">
                    <i class="fa-solid fa-magnifying-glass-plus"></i>
                </button>
                <img id="main-image" 
                     src="${images[0]}" 
                     width="600" 
                     height="600" 
                     fetchpriority="high" 
                     loading="eager" 
                     decoding="sync"
                     alt="${product.name}">
            </div>
        </div>

        <div class="detail-info">
            <div class="info-header">
                <span class="detail-category">${(product.category || 'Varios').toUpperCase()} &mdash; ${(product.gender || 'Unisex').toUpperCase()}</span>
                <h1 class="detail-title">${product.name}</h1>
                <div class="detail-price-row">
                    <span class="detail-price">${window.formatPrice(product.price)}</span>
                    <span class="stock-badge" style="color: ${product.stock > 0 ? '#2ecc71' : '#dc3545'}">${product.stock > 0 ? `Stock: ${product.stock} u.` : 'Agotado'}</span>
                </div>
            </div>

            <p class="detail-description">${product.description || 'Sin descripción disponible.'}</p>

            <div class="product-config">
                <div class="config-group">
                    <label>Seleccionar Talle</label>
                    <div class="sizes-grid">${sizesHtml}</div>
                </div>

                <div class="config-group">
                    <label>Cantidad</label>
                    <div class="qty-selector" style="${product.stock <= 0 ? 'opacity: 0.5; pointer-events: none;' : ''}">
                        <button onclick="window.adjustQty(-1, ${product.stock})">-</button>
                        <input type="text" id="qty-display" value="1" readonly>
                        <button onclick="window.adjustQty(1, ${product.stock})">+</button>
                    </div>
                </div>
            </div>

            <div class="detail-actions">
                <button class="btn-add-cart" onclick="window.addToCart()" ${product.stock <= 0 ? 'disabled style="background: #555; cursor: not-allowed;"' : ''}>
                    ${product.stock > 0 ? 'Agregar al Carrito <i class="fa-solid fa-cart-plus"></i>' : 'Sin Stock'}
                </button>
            </div>
        </div>
    `;

    console.log("✅ Detalle renderizado");
}

function renderRelatedProducts(currentProduct, allProducts) {
    try {
        // 1. Filtrar productos relacionados (misma categoría)
        const related = allProducts.filter(p =>
            String(p.id) !== String(currentProduct.id) &&
            p.category === currentProduct.category
        ).slice(0, 4);

        // 2. Rellenar con otros productos si no hay suficientes
        if (related.length < 4) {
            const others = allProducts.filter(p =>
                String(p.id) !== String(currentProduct.id) &&
                !related.some(r => String(r.id) === String(p.id))
            ).sort(() => 0.5 - Math.random());

            related.push(...others.slice(0, 4 - related.length));
        }

        if (related.length === 0) {
            console.log("ℹ️ Sin productos relacionados");
            return;
        }

        // 3. Buscar o crear contenedor
        let container = document.getElementById('related-products-container');
        if (!container) {
            // Inyectar el contenedor dinámicamente debajo del detalle del producto
            container = document.createElement('div');
            container.id = 'related-products-container';
            const detailContainer = document.getElementById('product-detail-container');
            if (detailContainer && detailContainer.parentNode) {
                detailContainer.parentNode.insertBefore(container, detailContainer.nextSibling);
            } else {
                document.body.appendChild(container); // Fallback
            }
        }

        // 4. Generar HTML
        const cardsHtml = related.map(p => {
            const safeId = String(p.id);
            const optimizedImg = window.optimizeCloudinary(p.image, 400);

            return `
        <div class="product-card" onclick="window.location.href='detailProduct.html?id=${safeId}'" style="cursor: pointer;">
            <div class="card-image">
                <img src="${optimizedImg}" alt="${p.name}" 
                     width="300" height="300" loading="lazy">
                <div class="card-actions">
                    <button class="btn-shop" onclick="event.stopPropagation(); window.location.href='detailProduct.html?id=${safeId}'">
                        Lo Quiero 🔥
                    </button>
                </div>
            </div>
            <div class="card-details">
                <div class="card-header">
                    <h3>${p.name}</h3>
                    <span class="price">${window.formatPrice(p.price)}</span>
                </div>
                <div class="tags">
                    <span>${(p.category || 'Varios').toUpperCase()}</span>
                </div>
            </div>
        </div>`;
        }).join('');

        container.innerHTML = `
        <section class="productos-section" style="padding-top: 2rem;">
            <h3 class="section-title" style="font-size: 2rem;">Recomendado para <span class="highlight">vos</span></h3>
            <div class="products-grid">
                ${cardsHtml}
            </div>
        </section>`;

        console.log("✅ Relacionados renderizados:", related.length);

    } catch (error) {
        console.error("❌ Error renderizando relacionados:", error);
    }
}

function renderErrorState(id, count) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    // 1. Mostrar spinner inmediatamente en lugar del error.
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px; gap: 20px;">
            <div class="spinner-loader" style="width: 60px; height: 60px; border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #2ecc71; border-radius: 50%; animation: spin-loader 1s linear infinite;"></div>
            <p style="color: #888; font-size: 16px; margin: 0;">Cargando...</p>
        </div>
        <style> @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } </style>
    `;

    // 2. Reintentar la búsqueda después de 3 segundos.
    setTimeout(async () => {
        // Si el producto ya fue cargado por el evento firebase-ready, no hacer nada
        if (isProductLoaded) return;

        const finalProducts = await fetchAllProducts();
        const finalProduct = finalProducts.find(p => String(p.id) === String(id));

        // 3. Si se encuentra, renderizar el producto.
        if (finalProduct) {
            console.log("✅ [Detail] Producto encontrado tras la sincronización:", finalProduct.name);
            currentProductDetails = finalProduct;
            isProductLoaded = true;
            renderProductDetail(finalProduct);
            renderRelatedProducts(finalProduct, finalProducts);
            loadExternalComponents();
        } else {
            // 4. Si aún no se encuentra, mostrar el mensaje de error definitivo.
            console.error("❌ Sincronización fallida. Producto no encontrado.");
            container.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: #fff;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 4rem; color: #2ecc71; margin-bottom: 20px; display: block;"></i>
                    <h2 style="font-size: 2rem; margin-bottom: 10px;">Producto no encontrado</h2>
                    <p style="color: #999; margin-bottom: 10px;">No pudimos encontrar el producto con ID: <strong>${id}</strong></p>
                    <p style="font-size: 0.85rem; color: #666;">Total de productos disponibles: ${finalProducts.length}</p>
                    <button onclick="window.location.href='index.html'" class="btn-shop" style="margin-top: 30px;">
                        Volver al Inicio
                    </button>
                </div>
            `;
        }
    }, 3000);
}

function showLoadingScreen() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px; gap: 20px;">
            <div class="spinner-loader" style="
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top: 4px solid #2ecc71;
                border-radius: 50%;
                animation: spin-loader 1s linear infinite;
            "></div>
            <p style="color: #888; font-size: 16px; margin: 0;">Cargando producto...</p>
        </div>
        <style>
            @keyframes spin-loader {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// ============================================
// INTERACCIÓN CON EL USUARIO
// ============================================

window.changeMainImage = function(src, thumb) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = src;
    }
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
};

window.selectSize = function(size, btn) {
    currentSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
};

window.adjustQty = function(delta, maxStock) {
    // Aseguramos que maxStock sea un número válido y mínimo 5 si es nulo/undefined
    const safeMaxStock = (maxStock !== undefined && maxStock !== null) ? parseInt(maxStock) : 5;
    const newValue = currentQuantity + delta;

    // Condición: valor entre 1 y el mínimo entre el stock real y el límite de 10 unidades
    if (newValue >= 1 && newValue <= Math.min(safeMaxStock, 10)) {
        currentQuantity = newValue;
        const qtyDisplay = document.getElementById('qty-display');
        if (qtyDisplay) {
            qtyDisplay.value = currentQuantity;
        }
    }
};

window.addToCart = function() {
    if (!window.cartManager) {
        alert("El carrito se está cargando, intenta de nuevo en un momento.");
        return;
    }
    if (!currentProductDetails) {
        alert("Producto no disponible");
        return;
    }

    window.cartManager.addItem(currentProductDetails, currentQuantity, currentSize);
};

/**
 * Abre un modal con la imagen en alta resolución para apreciar texturas.
 */
window.openZoomModal = function() {
    const mainImg = document.getElementById('main-image');
    if (!mainImg) return;

    // Si es Cloudinary, solicitamos una versión de máxima calidad (2000px)
    let zoomSrc = mainImg.src;
    if (zoomSrc.includes('cloudinary.com')) {
        // Cambiamos el ancho a 2000 y forzamos calidad máxima
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
            <img src="${zoomSrc}" alt="Zoom de producto">
            <p style="color: #888; text-align: center; margin-top: 10px; font-size: 0.9rem;">
                Usa el gesto de pinza o scroll para ver detalles
            </p>
        </div>
    `;

    document.body.appendChild(modal);
};

// ============================================
// COMPONENTES EXTERNOS (No-blocking)
// ============================================

function loadExternalComponents() {
    // Esto se ejecuta de forma no-blocking
    setTimeout(() => {
        try {
            if (typeof UIComponentLoader !== 'undefined') {
                UIComponentLoader.loadComponent('filters-container', 'filters.html');

                // Cargar filtros
                const script = document.createElement('script');
                script.src = '../JavaScript/filters.js';
                script.onload = () => {
                    if (typeof initFilters === 'function') {
                        initFilters();
                    }
                };
                document.body.appendChild(script);

                // Configurar botón de filtro
                const navFilterBtn = document.getElementById('nav-filter-btn');
                if (navFilterBtn) {
                    navFilterBtn.addEventListener('click', () => {
                        const sidebar = document.getElementById('filters-sidebar');
                        const overlay = document.getElementById('overlay');
                        if (sidebar) sidebar.classList.add('open');
                        if (overlay) overlay.classList.add('active');
                    });
                }
            }
        } catch (error) {
            console.error("❌ Error cargando componentes externos:", error);
        }
    }, 100);
}
