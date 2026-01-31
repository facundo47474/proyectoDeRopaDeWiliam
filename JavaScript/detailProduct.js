document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del producto de la URL
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'));

    if (!productId) {
        window.location.href = 'catalogo.html'; // Redirigir si no hay ID
        return;
    }

    // 2. Buscar producto en la "Base de Datos" (data.js)
    // Aseguramos que MOCK_DB esté disponible
    if (typeof MOCK_DB === 'undefined') {
        console.error('Error: data.js no ha sido cargado.');
        return;
    }

    const product = MOCK_DB.find(p => p.id === productId);

    if (!product) {
        document.getElementById('product-detail-container').innerHTML = '<h2>Producto no encontrado</h2>';
        return;
    }

    // 3. Renderizar Detalle
    renderProductDetail(product);

    // 4. Cargar y Configurar Filtros para Sugerencias
    if (typeof UIComponentLoader !== 'undefined') {
        await UIComponentLoader.loadComponent('filters-container', 'filters.html');
        loadScript('../JavaScript/filters.js', () => { if (typeof initFilters === 'function') initFilters(); });

        // Configurar botón de filtro del Navbar (Lógica específica para esta página)
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

    // 5. Inicializar lógica de productos relacionados con filtros
    // Cargamos todos los productos excepto el actual como candidatos
    allRelatedProducts = MOCK_DB.filter(p => p.id !== product.id);
    
    // Filtro inicial: misma categoría que el producto actual
    relatedFilters.category = product.category;
    applyRelatedFilters();

    // Escuchar cambios en los filtros
    document.addEventListener('app:filter-change', (e) => {
        const { key, value } = e.detail;
        relatedFilters[key] = value;
        applyRelatedFilters();
    });

    // 6. Renderizar Lore (Historia de Marca)
    renderLore();
});

// Variables de estado local para el detalle
let currentSize = null;
let currentQuantity = 1;

// Variables para filtrado de relacionados
let allRelatedProducts = [];
let relatedFilters = {
    category: 'all',
    maxPrice: 1000000
};

function renderProductDetail(product) {
    const container = document.getElementById('product-detail-container');

    // Preparar HTML de imágenes (Principal + Miniaturas)
    // Usamos product.images si existe, sino fallback a product.image
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    const sizes = product.sizes || ['S', 'M', 'L', 'XL']; // Fallback sizes

    // Configurar estado inicial
    currentSize = sizes[0];

    const thumbnailsHtml = images.map((img, index) => `
        <div class="thumb-item ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
            <img src="${img}" alt="thumbnail">
        </div>
    `).join('');

    const sizesHtml = sizes.map((size, index) => `
        <button class="size-btn ${index === 0 ? 'selected' : ''}" onclick="selectSize('${size}', this)">${size}</button>
    `).join('');

    container.innerHTML = `
        <div class="product-gallery">
            <div class="gallery-thumbs">
                ${thumbnailsHtml}
            </div>
            <div class="gallery-main">
                <img id="main-image" src="${images[0]}" alt="${product.name}">
            </div>
        </div>

        <div class="detail-info">
            <div class="info-header">
                <span class="detail-category">${product.category} &mdash; ${product.gender}</span>
                <h1 class="detail-title">${product.name}</h1>
                <div class="detail-price-row">
                    <span class="detail-price">$${product.price.toLocaleString()}</span>
                    <span class="stock-badge">En Stock</span>
                </div>
            </div>

            <p class="detail-description">
                ${product.description}
            </p>

            <div class="product-config">
                <div class="config-group">
                    <label>Seleccionar Talle</label>
                    <div class="sizes-grid">
                        ${sizesHtml}
                    </div>
                </div>

                <div class="config-group">
                    <label>Cantidad</label>
                    <div class="qty-selector">
                        <button onclick="adjustQty(-1)">-</button>
                        <input type="text" id="qty-display" value="1" readonly>
                        <button onclick="adjustQty(1)">+</button>
                    </div>
                </div>
            </div>

            <div class="detail-actions">
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                    Agregar al Carrito <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
            
            <div class="extra-features">
                <div class="feature"><i class="fa-solid fa-truck-fast"></i> Envío Gratis > $80k</div>
                <div class="feature"><i class="fa-solid fa-shield-halved"></i> Garantía de 30 días</div>
            </div>
        </div>
    `;
}

// Funciones globales para interacción en el DOM
window.changeMainImage = function (src, thumbElement) {
    document.getElementById('main-image').src = src;
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    thumbElement.classList.add('active');
};

window.selectSize = function (size, btnElement) {
    currentSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
};

window.adjustQty = function (delta) {
    const newQty = currentQuantity + delta;
    if (newQty >= 1 && newQty <= 10) {
        currentQuantity = newQty;
        document.getElementById('qty-display').value = currentQuantity;
    }
};

// Función global para agregar al carrito
window.addToCart = function (productId) {
    console.log("🛍️ [DETAIL] addToCart llamado con ID:", productId);
    console.log("🛍️ [DETAIL] Estado del sistema:", {
        MOCK_DB: !!window.MOCK_DB,
        cartManager: !!window.cartManager,
        CartManagerClass: typeof window.CartManager
    });

    // Verificar MOCK_DB
    const db = window.MOCK_DB;
    if (!db) {
        console.error("❌ [DETAIL] MOCK_DB no disponible");
        alert("Error: Base de datos de productos no cargada. Recarga la página (F5).");
        return;
    }

    // Verificar CartManager
    if (!window.cartManager) {
        console.warn("⚠️ [DETAIL] CartManager no disponible - intentando recuperación");

        // Intentar instanciar si la clase existe
        if (window.CartManager) {
            try {
                console.log("🔄 [DETAIL] Instanciando CartManager manualmente...");
                window.cartManager = new window.CartManager();
                console.log("✅ [DETAIL] CartManager instanciado exitosamente");
            } catch (e) {
                console.error("❌ [DETAIL] Fallo al instanciar CartManager:", e);
                alert("Error: No se pudo inicializar el carrito. Recarga la página (F5).");
                return;
            }
        } else {
            console.error("❌ [DETAIL] Clase CartManager no existe");
            alert("Error: Sistema de carrito no cargado. Verifica que cart.js esté incluido.");
            return;
        }
    }

    // Buscar producto
    const product = db.find(p => p.id === parseInt(productId));
    if (!product) {
        console.error("❌ [DETAIL] Producto no encontrado:", productId);
        alert("Error: Producto no encontrado en la base de datos.");
        return;
    }

    console.log("✅ [DETAIL] Producto encontrado:", product.name);

    // Obtener cantidad y talle
    const qty = (typeof currentQuantity !== 'undefined') ? currentQuantity : 1;
    const size = (typeof currentSize !== 'undefined' && currentSize)
        ? currentSize
        : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');

    console.log("🛍️ [DETAIL] Añadiendo:", qty, "x", product.name, "Talle:", size);

    // Añadir al carrito
    try {
        window.cartManager.addItem(product, qty, size);
        console.log("✅ [DETAIL] Producto añadido exitosamente");
    } catch (e) {
        console.error("❌ [DETAIL] Error añadiendo al carrito:", e);
        alert("Error: No se pudo añadir el producto al carrito.");
    }
};

function applyRelatedFilters() {
    const filtered = allRelatedProducts.filter(p => {
        const catMatch = relatedFilters.category === 'all' || p.category === relatedFilters.category;
        const priceMatch = p.price <= relatedFilters.maxPrice;
        return catMatch && priceMatch;
    });
    // Mostramos hasta 4 sugerencias que cumplan los filtros
    renderRelatedProducts(filtered.slice(0, 4));
}

function renderRelatedProducts(products) {
    const container = document.getElementById('related-products-container');

    if (products.length === 0) return;

    let html = `
        <h3 class="related-title">
            <span></span><span></span><span></span><span></span>
            Por si te gustó lo que viste 🔥
        </h3>`;
    html += '<div class="products-grid">'; // Reutilizamos la clase grid de catalogo.css/productos.css

    products.forEach(product => {
        html += `
            <div class="product-card">
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="card-actions">
                        <button class="btn-shop" onclick="window.location.href='detailProduct.html?id=${product.id}'">Ver Producto</button>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-header">
                        <h3>${product.name}</h3>
                        <span class="price">$${product.price.toLocaleString()}</span>
                    </div>
                    <p class="card-desc">Estilo urbano de alta calidad.</p>
                    <div class="tags">
                        <span>${product.category.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
        if (callback) callback();
    };
    document.body.appendChild(script);
}

function renderLore() {
    const container = document.getElementById('lore-container');
    if (!container) return;

    container.innerHTML = `
        <div class="lore-section">
            <div class="lore-content">
                <h2 class="lore-title">El Alma de UrbanHustler</h2>
                <p class="lore-text">
                    En un mundo de copias, elegiste ser original. <br>
                    No fabricamos ropa para llenar armarios, forjamos identidad para quienes se atreven a desafiar lo establecido.
                    <br><br>
                    Cada hilo de nuestras prendas lleva la tensión de la calle, la pasión del arte y la fuerza de quien no se rinde.
                    Cuando usas UrbanHustler, no solo te vistes; te pones la piel de los que sueñan despiertos y trabajan mientras otros duermen.
                    <br><br>
                    <strong>Gracias por ser parte de la resistencia. Gracias por elegir la autenticidad.</strong>
                </p>
                <div class="lore-signature">
                    <span>Mas que una marca, una familia !</span>
                </div>
            </div>
        </div>
    `;
}