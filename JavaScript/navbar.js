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

    // --- LÓGICA DE RECUPERACIÓN DEL LOGO ---
    const logo = document.querySelector('.logo');
    if (logo) {
        // 1. Si el logo está vacío (sin texto ni imagen), inyectamos el nombre
        if (!logo.innerHTML.trim()) {
            logo.textContent = "URBANHUSTLER";
        }
        // 2. Si es una imagen, corregimos la ruta para salir de la carpeta HTML
        const logoImg = logo.querySelector('img');
        if (logoImg) {
            const src = logoImg.getAttribute('src');
            if (src && !src.startsWith('../') && !src.startsWith('http')) {
                logoImg.src = '../' + src;
            }
        }
        // 3. Redirección al Home
        logo.onclick = () => window.location.href = 'index.html';
    }

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
    
    // Inicializar Login de Google en el Navbar
    initGoogleLogin();

    // Notificar al sistema que el navbar está listo
    document.dispatchEvent(new Event('app:navbar-loaded'));

    // Cargar Carrusel
    if (document.getElementById('carousel-container')) {
        await UIComponentLoader.loadComponent('carousel-container', 'carousel.html');
        // Inicializar lógica del carrusel (función definida en carousel.js)
        if (typeof initCarousel === 'function') {
            initCarousel();
        }
    }

    // Cargar Sección de Redes Sociales
    if (document.getElementById('social-media-container')) {
        await UIComponentLoader.loadComponent('social-media-container', 'SocialMedia.html');
        if (typeof initSocialMedia === 'function') {
            initSocialMedia();
        }

        // Actualizar número de WhatsApp (Buscamos específicamente el icono de WhatsApp)
        setTimeout(() => {
            const waIcon = document.querySelector('#social-media-container .fa-whatsapp');
            if (waIcon) {
                const waLink = waIcon.closest('a');
                if (waLink) {
                    waLink.href = "https://wa.me/5493758545846";
                    waLink.target = "_blank";
                    // IMPORTANTE: Evitar que el slider 3D capture el clic y lo bloquee
                    waLink.addEventListener('mousedown', (e) => e.stopPropagation());
                    waLink.addEventListener('click', (e) => e.stopPropagation());
                }
            }
        }, 100);
    }

    // Cargar Sección de Portadas
    if (document.getElementById('portadas-container')) {
        await UIComponentLoader.loadComponent('portadas-container', 'portadas.html');
        if (typeof initPortadas === 'function') {
            initPortadas();
        }
    }

    // Cargar Sección de Productos
    if (document.getElementById('productos-container')) {
        await UIComponentLoader.loadComponent('productos-container', 'productos.html');
        if (typeof initProductos === 'function') {
            initProductos();
        }
    }

    // Cargar Sección de Ubicación
    if (document.getElementById('ubicacion-container')) {
        await UIComponentLoader.loadComponent('ubicacion-container', 'ubicacion.html');
        if (typeof initUbicacion === 'function') {
            initUbicacion();
        }
    }

    // Cargar Sección de Newsletter
    if (document.getElementById('newsletter-container')) {
        await UIComponentLoader.loadComponent('newsletter-container', 'newsletter.html');
        if (typeof initNewsletter === 'function') {
            initNewsletter();
        }
    }

    // Cargar Sección de Footer
    await UIComponentLoader.loadComponent('footer-container', 'footer.html');
});

/* ==========================================
   LÓGICA DE LOGIN GOOGLE (Navbar Integration)
   ========================================== */
function initGoogleLogin() {
    // Asegurar que la librería de Google esté presente (para Catalogo/Detalle si falta en HTML)
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    // 1. Mostrar el contenedor con el logo inmediatamente (Placeholder)
    renderGoogleLogin();

    // 2. Esperar a que la librería de Google cargue para activar la funcionalidad
    const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
            clearInterval(checkGoogle);
            // Si no hay sesión activa, inicializamos el botón oficial interactivo
            if (!localStorage.getItem('user_token')) {
                showLoginButton();
            }
        }
    }, 100);
}

function renderGoogleLogin() {
    const navIcons = document.querySelector('.nav-icons');
    if (!navIcons) return;

    // Evitar duplicados si ya existe
    if (document.getElementById('google-login-container')) return;

    // Crear contenedor para el botón/avatar
    const container = document.createElement('div');
    container.id = 'google-login-container';
    container.style.marginLeft = '20px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    
    // AÑADIDO: Icono por defecto (Logo de Google) para que sea visible inmediatamente
    container.innerHTML = '<i class="fa-solid fa-user" style="font-size: 1.2rem; color: #fff; cursor: pointer;" title="Iniciar sesión"></i>';
    
    // Fallback: Hacemos que este icono sea clicable por si el botón oficial falla o tarda
    container.onclick = function() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt(); // Intenta abrir el One Tap login
        }
    };
    
    // Insertar al final de los iconos (a la derecha del carrito)
    navIcons.appendChild(container);

    // Verificar si ya hay sesión guardada
    const userToken = localStorage.getItem('user_token');
    const userInfo = localStorage.getItem('user_info');

    if (userToken && userInfo) {
        const user = JSON.parse(userInfo);
        showLoggedInState(user);
    }
}

function showLoginButton() {
    const container = document.getElementById("google-login-container");
    if (!container) return;

    // IMPORTANTE: Si no has configurado tu ID real, no intentamos cargar el botón
    // para evitar que desaparezca el icono por defecto.
    const clientId = "775227629128-j92ormbg985g0v0lvl4i0eluk21act38.apps.googleusercontent.com";

    // VERIFICACIÓN DE SEGURIDAD: Google Login no funciona en protocolo file://
    if (window.location.protocol === 'file:') {
        console.warn("⚠️ Google Login: No funciona abriendo el archivo directamente. Usa un servidor local (Live Server).");
        console.warn("👉 Se mantiene el icono visual por defecto.");
        return; // Salimos para no borrar el icono
    }

    if (clientId === "TU_CLIENT_ID_AQUI") {
        console.warn("⚠️ Google Login: Falta configurar el Client ID. Se mantiene el icono visual.");
        return;
    }

    // DEBUG: Muestra en la consola (F12) la URL exacta que debes autorizar
    console.log("🌍 Google Login - Tu origen actual es:", window.location.origin);
    console.log("👉 Copia esa URL y agrégala en 'Orígenes de JavaScript autorizados' en Google Cloud Console.");

    // Limpiar el icono placeholder antes de renderizar el botón oficial
    container.onclick = null; // Quitamos el evento manual para dejar que Google maneje el click
    container.innerHTML = '';

    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        container,
        { theme: "filled_black", size: "medium", shape: "circle", type: "icon" } 
    );
}

function handleCredentialResponse(response) {
    const responsePayload = decodeJwtResponse(response.credential);
    
    // Guardar sesión
    localStorage.setItem('user_token', response.credential);
    localStorage.setItem('user_info', JSON.stringify(responsePayload));
    
    showLoggedInState(responsePayload);
    location.reload(); // Recargar para actualizar estado en toda la app
}

function showLoggedInState(user) {
    const container = document.getElementById('google-login-container');
    if (container) {
        container.innerHTML = `
            <img src="${user.picture}" alt="${user.name}" title="Logueado como ${user.name} (Click para salir)" 
                 style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;"
                 onclick="if(confirm('¿Cerrar sesión?')) { localStorage.removeItem('user_token'); localStorage.removeItem('user_info'); location.reload(); }">
        `;
    }
}

function decodeJwtResponse(token) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return {}; }
}