document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Navbar y Footer (Reutilizando UIComponentLoader de navbar.js si está disponible, sino manual)
    // Asumimos que navbar.js ya tiene la clase UIComponentLoader.
    
    if (typeof UIComponentLoader !== 'undefined') {
        // Cargar componentes específicos del catálogo
        await UIComponentLoader.loadComponent('filters-container', 'filters.html');
        
        // Cargar Carrusel del Catálogo
        await UIComponentLoader.loadComponent('catalog-carousel-container', 'catalogCarousel.html');
        
        // Inicializar scripts de los componentes cargados
        loadScript('../JavaScript/filters.js', () => { if (typeof initFilters === 'function') initFilters(); });
        loadScript('../JavaScript/carousel.js', () => { if (typeof initCarousel === 'function') initCarousel(); });

        // Configurar eventos del Navbar (Buscador y Botón Filtros)
        const navSearchInput = document.getElementById('navbar-search-input');
        const navFilterBtn = document.getElementById('nav-filter-btn');

        if (navSearchInput) {
            navSearchInput.addEventListener('input', (e) => window.filterProducts(e.target.value));
        }

        if (navFilterBtn) {
            navFilterBtn.addEventListener('click', () => {
                const sidebar = document.getElementById('filters-sidebar');
                const overlay = document.getElementById('overlay');
                if (sidebar) sidebar.classList.add('open');
                if (overlay) overlay.classList.add('active');
            });
        }
    }

    // 2. Inicializar la aplicación con Arquitectura Escalable
    const app = new ProductController(new ProductModel(), new ProductView(), new ProductService());
    await app.init();

    // 3. Recargar cuando Firebase esté listo (para mostrar datos reales en otros dispositivos)
    document.addEventListener('firebase-ready', async () => {
        console.log("🔄 Actualizando catálogo con datos de la nube...");
        await app.init();
    });
});

// Función auxiliar para cargar scripts dinámicamente
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => {
        if (callback) callback();
    };
    document.body.appendChild(script);
}

// Adaptador para scripts legacy o externos (search.js)
// Convierte llamadas directas en eventos del sistema
window.filterProducts = function(term) {
    document.dispatchEvent(new CustomEvent('app:filter-change', {
        detail: { key: 'searchTerm', value: term }
    }));
};
