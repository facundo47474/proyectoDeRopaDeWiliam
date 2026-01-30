document.addEventListener('DOMContentLoaded', () => {
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

    // 4. Renderizar Sugerencias (Relacionados por categoría, excluyendo el actual)
    const relatedProducts = MOCK_DB.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    renderRelatedProducts(relatedProducts);
});

function renderProductDetail(product) {
    const container = document.getElementById('product-detail-container');
    container.innerHTML = `
        <div class="detail-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="detail-info">
            <span class="detail-category">${product.category} / ${product.gender}</span>
            <h1 class="detail-title">${product.name}</h1>
            <span class="detail-price">$${product.price.toLocaleString()}</span>
            <p class="detail-description">
                ${product.description || 'Prenda exclusiva de la colección UrbanHustler. Diseñada para destacar con estilo y comodidad en cualquier entorno urbano.'}
            </p>
            <div class="detail-actions">
                <button class="btn-add-cart" onclick="alert('¡Producto agregado al carrito!')">
                    Agregar al Carrito <i class="fa-solid fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;
}

function renderRelatedProducts(products) {
    const container = document.getElementById('related-products-container');
    
    if (products.length === 0) return;

    let html = '<h3 class="related-title">También te podría gustar</h3>';
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