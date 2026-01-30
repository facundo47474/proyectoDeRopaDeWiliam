// Datos Mock de Productos (Imágenes genéricas de Unsplash)
const productsData = [
    { id: 1, name: "Urban Hoodie Black", price: 45000, category: "hoodie", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop" },
    { id: 2, name: "Cargo Pants Tactical", price: 32000, category: "pants", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop" },
    { id: 3, name: "Oversize Tee White", price: 25000, category: "tshirt", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop" },
    { id: 4, name: "Streetwear Jacket", price: 65000, category: "hoodie", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop" },
    { id: 5, name: "Jeans Rotos", price: 38000, category: "pants", image: "https://images.unsplash.com/photo-1542272617-08f086302542?q=80&w=1000&auto=format&fit=crop" },
    { id: 6, name: "Graphic Tee Neon", price: 28000, category: "tshirt", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop" },
    { id: 7, name: "Techwear Hoodie", price: 55000, category: "hoodie", image: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?q=80&w=1000&auto=format&fit=crop" },
    { id: 8, name: "Shorts Deportivos", price: 22000, category: "pants", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop" }
];

// Variables Globales de Filtro
window.currentCategory = 'all';
window.maxPrice = 100000;
window.searchTerm = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Navbar y Footer (Reutilizando UIComponentLoader de navbar.js si está disponible, sino manual)
    // Asumimos que navbar.js ya tiene la clase UIComponentLoader.
    
    if (typeof UIComponentLoader !== 'undefined') {
        // Cargar componentes específicos del catálogo
        await UIComponentLoader.loadComponent('search-container', 'search.html');
        await UIComponentLoader.loadComponent('filters-container', 'filters.html');
        
        // Inicializar scripts de los componentes cargados
        loadScript('search.js', () => { if (typeof initSearch === 'function') initSearch(); });
        loadScript('filters.js', () => { if (typeof initFilters === 'function') initFilters(); });
    }

    // 2. Renderizar productos iniciales
    renderProducts(productsData);
});

// Función auxiliar para cargar scripts dinámicamente
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
        if (callback) callback();
    };
    document.body.appendChild(script);
}

// Función de Renderizado
function renderProducts(products) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div class="no-results">No se encontraron productos con esos filtros.</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="card-actions">
                    <button class="btn-shop">Comprar Ahora</button>
                </div>
            </div>
            <div class="card-details">
                <div class="card-header">
                    <h3>${product.name}</h3>
                    <span class="price">$${product.price.toLocaleString()}</span>
                </div>
                <p class="card-desc">Estilo urbano de alta calidad. Edición limitada.</p>
                <div class="tags">
                    <span>${product.category.toUpperCase()}</span>
                    <span>NUEVO</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Lógica de Filtrado Global
window.applyFilters = function() {
    const filtered = productsData.filter(product => {
        // Filtro por Categoría
        const currentCat = window.currentCategory || 'all';
        const catMatch = currentCat === 'all' || product.category === currentCat;
        
        // Filtro por Precio
        const maxP = window.maxPrice || 100000;
        const priceMatch = product.price <= maxP;
        
        // Filtro por Búsqueda
        const term = (window.searchTerm || '').toLowerCase();
        const searchMatch = product.name.toLowerCase().includes(term);

        return catMatch && priceMatch && searchMatch;
    });

    renderProducts(filtered);
};

// Función llamada desde search.js
window.filterProducts = function(term) {
    window.searchTerm = term || '';
    window.applyFilters();
};
