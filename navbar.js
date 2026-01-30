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

// Inicialización de componentes
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Navbar
    await UIComponentLoader.loadComponent('navbar-container', 'navbar.html');
    
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