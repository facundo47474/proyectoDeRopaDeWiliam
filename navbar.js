/**
 * UIComponentLoader
 * Clase encargada de la gestión y carga de componentes de interfaz.
 * Cumple con SRP (Single Responsibility Principle) al aislar la lógica de carga.
 */
class UIComponentLoader {
    /**
     * Carga un componente HTML de forma asíncrona en un contenedor específico.
     * @param {string} containerId - ID del elemento DOM donde se inyectará el componente.
     * @param {string} sourcePath - Ruta del archivo HTML a cargar.
     */
    static async loadComponent(containerId, sourcePath) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`[UIComponentLoader] Error: Contenedor #${containerId} no encontrado.`);
            return;
        }

        try {
            const response = await fetch(sourcePath);
            if (!response.ok) throw new Error(`Estado HTTP ${response.status}`);
            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error(`[UIComponentLoader] Fallo al cargar ${sourcePath}:`, error);
        }
    }
}

function setupNavigation() {
    const navHome = document.getElementById('nav-home');
    const navMen = document.getElementById('nav-men');
    const navWomen = document.getElementById('nav-women');
    const navOffers = document.getElementById('nav-offers');
    const navCollection = document.getElementById('nav-collection');

    const isHome = document.body.classList.contains('home-page');
    const isCatalog = document.body.classList.contains('catalog-page');

    if (isCatalog) {
        // Lógica para el Catálogo (SPA behavior)
        const applyNavFilter = (e, key, value) => {
            e.preventDefault();
            // Emitir evento para que ProductController actualice la grilla
            document.dispatchEvent(new CustomEvent('app:filter-change', {
                detail: { key, value }
            }));
            // Actualizar URL visualmente sin recargar
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.pushState({}, '', url);
        };

        if (navMen) navMen.addEventListener('click', (e) => applyNavFilter(e, 'gender', 'men'));
        if (navWomen) navWomen.addEventListener('click', (e) => applyNavFilter(e, 'gender', 'women'));
        if (navOffers) navOffers.addEventListener('click', (e) => applyNavFilter(e, 'maxPrice', 30000));
        if (navCollection) navCollection.addEventListener('click', (e) => {
             applyNavFilter(e, 'category', 'all'); // Resetear filtros
        });
    } else {
        // Lógica por defecto (Home, Detalle, etc.)
        // Configurar enlaces para redirigir al catálogo con parámetros
        if (navMen) navMen.href = "catalogo.html?gender=men";
        if (navWomen) navWomen.href = "catalogo.html?gender=women";
        if (navOffers) navOffers.href = "catalogo.html?maxPrice=30000";
        if (navCollection) navCollection.href = "catalogo.html";

        // Caso específico Home: Cambiar texto de Inicio
        if (isHome && navHome) {
            navHome.textContent = "Ropa";
            navHome.href = "catalogo.html";
        }
    }
}

// Inicialización de componentes
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Navbar
    await UIComponentLoader.loadComponent('navbar-container', 'navbar.html');
    setupNavigation();
    
    // Cargar Carrusel
    await UIComponentLoader.loadComponent('carousel-container', 'carousel.html');
    
    // Inicializar lógica del carrusel (función definida en carousel.js)
    if (typeof initCarousel === 'function') {
        initCarousel();
    }

    // Cargar Sección de Redes Sociales
    await UIComponentLoader.loadComponent('social-media-container', 'SocialMedia.html');
    if (typeof initSocialMedia === 'function') {
        initSocialMedia();
    }

    // Cargar Sección de Portadas
    await UIComponentLoader.loadComponent('portadas-container', 'portadas.html');
    if (typeof initPortadas === 'function') {
        initPortadas();
    }

    // Cargar Sección de Productos
    await UIComponentLoader.loadComponent('productos-container', 'productos.html');
    if (typeof initProductos === 'function') {
        initProductos();
    }

    // Cargar Sección de Ubicación
    await UIComponentLoader.loadComponent('ubicacion-container', 'ubicacion.html');
    if (typeof initUbicacion === 'function') {
        initUbicacion();
    }

    // Cargar Sección de Newsletter
    await UIComponentLoader.loadComponent('newsletter-container', 'newsletter.html');
    if (typeof initNewsletter === 'function') {
        initNewsletter();
    }

    // Cargar Sección de Footer
    await UIComponentLoader.loadComponent('footer-container', 'footer.html');
});