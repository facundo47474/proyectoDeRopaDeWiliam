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
    // --- LÓGICA ESPECÍFICA PARA PANEL DE CONTROL ---
    if (window.location.pathname.includes('controlCenter.html')) {
        const navList = document.querySelector('.nav-links');
        const navIcons = document.querySelector('.nav-icons');

        // 1. Reemplazar enlaces de tienda por enlaces de administración
        if (navList) {
            navList.innerHTML = ''; // Limpiar menú estándar
            
            const adminLinks = [
                { text: 'Métricas', target: 'view-metrics', icon: 'fa-chart-line' },
                { text: 'Productos', target: 'view-products', icon: 'fa-box' },
                { text: 'Latest Drops', target: 'view-latest-drops', icon: 'fa-fire' },
                { text: 'Usuarios', target: 'view-users', icon: 'fa-users' },
                { text: 'Volver a Tienda', href: 'index.html', icon: 'fa-arrow-left' }
            ];

            adminLinks.forEach(link => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.innerHTML = `<i class="fa-solid ${link.icon}"></i> ${link.text}`;
                a.className = 'admin-nav-link'; // Clase para que controlCenter.js lo detecte
                if (link.target) a.setAttribute('data-target', link.target);
                if (link.href) a.href = link.href;
                else a.href = '#';
                
                li.appendChild(a);
                navList.appendChild(li);
            });
        }

        // 2. Ocultar iconos innecesarios (Carrito, Buscador, Login) en el panel
        if (navIcons) navIcons.style.display = 'none';

        // 3. Centralizar y limpiar el layout del Panel (Responsive Fix)
        const navbar = document.querySelector('.navbar');
        
        if (navbar) {
            // Inyectar estilos CSS dinámicos para manejar media queries correctamente
            const styleId = 'admin-navbar-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .navbar.admin-mode {
                        justify-content: center;
                        background: #000 !important; /* Fondo negro sólido */
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    }
                    .navbar.admin-mode .logo,
                    .navbar.admin-mode .nav-icons,
                    .navbar.admin-mode .nav-filter-btn {
                        display: none !important;
                    }
                    .navbar.admin-mode .nav-links {
                        margin: 0;
                        gap: 40px;
                        width: auto;
                    }
                    .navbar.admin-mode .nav-links li a {
                        color: #fff;
                        font-weight: 600;
                        letter-spacing: 1px;
                        font-size: 0.95rem;
                    }
                    .navbar.admin-mode .nav-links li a:hover { color: #bdc3c7; }
                    @media (max-width: 768px) {
                        .navbar.admin-mode {
                            justify-content: flex-end !important;
                            padding: 15px 20px;
                            height: 70px;
                        }
                        .navbar.admin-mode .menu-toggle {
                            display: block;
                            font-size: 2rem;
                            margin: 0;
                        }
                        .navbar.admin-mode .nav-links {
                            gap: 0;
                            padding-top: 60px;
                        }
                        .navbar.admin-mode .nav-links li {
                            margin: 25px 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            navbar.classList.add('admin-mode');
        }
    }
    // -----------------------------------------------------------

    // --- MODIFICACIÓN ESTRUCTURAL DEL NAVBAR (DOM Patching) ---
    const navList = document.querySelector('.nav-links');
    const oldNavMen = document.getElementById('nav-men');
    const oldNavWomen = document.getElementById('nav-women');
    const oldNavCollection = document.getElementById('nav-collection');

    // 1. Eliminar Hombre y Mujer
    if (oldNavMen && oldNavMen.parentElement) oldNavMen.parentElement.remove();
    if (oldNavWomen && oldNavWomen.parentElement) oldNavWomen.parentElement.remove();

    // 2. Agregar "New Drops" (si no existe)
    if (navList && !document.getElementById('nav-new-drops') && !window.location.pathname.includes('controlCenter.html')) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.id = 'nav-new-drops';
        a.textContent = 'New Drops';
        a.href = 'index.html#productos-container'; // Link a la sección Latest Drops
        li.appendChild(a);
        
        // Insertar después de Home
        const navHomeRef = document.getElementById('nav-home');
        if (navHomeRef && navHomeRef.parentElement) {
            navHomeRef.parentElement.after(li);
        } else {
            navList.prepend(li);
        }
    }

    // 3. Transformar Colección en Combos
    if (oldNavCollection) {
        oldNavCollection.id = 'nav-combos';
        oldNavCollection.textContent = 'Combos';
    }
    // -----------------------------------------------------------

    const navHome = document.getElementById('nav-home');
    const navNewDrops = document.getElementById('nav-new-drops');
    const navOffers = document.getElementById('nav-offers');
    const navCombos = document.getElementById('nav-combos');

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

    // --- LÓGICA RESPONSIVE (HAMBURGER MENU) ---
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    
    if (navbar && navLinks && !document.querySelector('.menu-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        toggleBtn.ariaLabel = "Menú";
        
        navbar.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = toggleBtn.querySelector('i');
            icon.className = navLinks.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });

        // Cerrar menú al hacer click en un enlace
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });

        // Cerrar menú al hacer scroll (Mejora UX móvil)
        window.addEventListener('scroll', () => {
            if(navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                toggleBtn.querySelector('i').className = 'fa-solid fa-bars';
            }
        });
    }

    // --- LÓGICA RESPONSIVE (SEARCH TOGGLE) ---
    const searchContainer = document.querySelector('.nav-search-container');
    const navIcons = document.querySelector('.nav-icons');

    if (searchContainer && navIcons && !document.querySelector('.search-toggle-mobile')) {
        const searchBtn = document.createElement('a');
        searchBtn.className = 'search-toggle-mobile';
        searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
        searchBtn.href = "#";
        searchBtn.ariaLabel = "Buscar";
        
        // Insertar al principio de los iconos
        navIcons.insertBefore(searchBtn, navIcons.firstChild);

        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchContainer.classList.toggle('active');
            
            // Enfocar input si se abre para escribir rápido
            if (searchContainer.classList.contains('active')) {
                const input = searchContainer.querySelector('input');
                if (input) setTimeout(() => input.focus(), 100);
            }
        });

        // Cerrar al hacer scroll para limpiar la vista
        window.addEventListener('scroll', () => {
            if (searchContainer.classList.contains('active')) {
                searchContainer.classList.remove('active');
            }
        });
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

        if (navOffers) navOffers.addEventListener('click', (e) => applyNavFilter(e, 'isOffer', 'true'));
        if (navCombos) navCombos.addEventListener('click', (e) => {
            applyNavFilter(e, 'category', 'combos'); // Filtrar por combos
        });
    } else {
        // Lógica por defecto (Home, Detalle, etc.)
        // Configurar enlaces para redirigir al catálogo con parámetros
        if (navNewDrops) navNewDrops.href = "index.html#productos-container";
        if (navOffers) navOffers.href = "catalogo.html?isOffer=true";
        if (navCombos) navCombos.href = "catalogo.html?category=combos";

        // Caso específico Home: Cambiar texto de Inicio
        if (isHome && navHome) {
            navHome.textContent = "Ropa";
            navHome.href = "catalogo.html";
        }
    }

    // --- LÓGICA DEL NOTCH (Despliegue) ---
    // Usamos un nombre distinto para evitar conflictos de variables o referencias nulas
    const navbarElement = document.querySelector('.navbar');
    if (navbarElement && !document.querySelector('.nav-notch-toggle')) {
        const toggle = document.createElement('div');
        toggle.className = 'nav-notch-toggle';
        toggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        toggle.title = "Desplegar Menú";
        navbarElement.appendChild(toggle);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar conflictos
            navbarElement.classList.toggle('expanded');
            
            // Si el usuario colapsa el notch, cerramos también el menú móvil si estaba abierto
            const navLinks = document.querySelector('.nav-links');
            if (!navbarElement.classList.contains('expanded') && navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const menuToggle = document.querySelector('.menu-toggle i');
                if (menuToggle) menuToggle.className = 'fa-solid fa-bars';
            }
        });
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
        
        // Renderizar productos dinámicos (Latest Drops) desde la base de datos
        renderLatestDrops();

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

    // Cargar Chatbot Globalmente (EXCEPTO en el Panel de Control)
    if (!window.location.pathname.includes('controlCenter.html')) {
        loadChatbotGlobal();
    }

    // --- INICIALIZAR ANIMACIONES DE SCROLL ---
    initScrollAnimations();
});

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Si es una portada, usa su lógica existente (.visible)
                if (entry.target.classList.contains('portada-item')) {
                    entry.target.classList.add('visible');
                } else {
                    // Para el resto, usa la nueva animación (.active)
                    entry.target.classList.add('active');
                }
            }
        });
    }, { threshold: 0.15 }); // Se activa al ver el 15% del elemento

    // Seleccionar elementos a animar
    const elements = document.querySelectorAll('.section-title, .portada-item, .newsletter-content, .info-card, .social-title');
    
    elements.forEach(el => {
        // Solo agregamos la clase base si NO es portada (para no romper su transform X)
        if (!el.classList.contains('portada-item')) {
            el.classList.add('reveal-up');
        }
        observer.observe(el);
    });
}

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
    
    // Guardar usuario en localStorage para el panel de control
    const users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
    const existingIndex = users.findIndex(u => u.email === responsePayload.email);
    
    const userData = {
        email: responsePayload.email,
        name: responsePayload.name,
        source: 'google',
        date: new Date().toISOString()
    };

    if (existingIndex > -1) {
        users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
        users.push(userData);
    }
    localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));

    // Mensajes personalizados por usuario (Admin / Creador)
    if (responsePayload.email === 'gimenez.william07@gmail.com') {
        sessionStorage.setItem('login_greeting', "<strong style='font-size:1.1em; color:#fff;'>Hola Wiliam</strong><br><span style='color:#ccc;'>Soy tu asistente inteligente.</span><br><span style='color:#D90429; font-weight:600; display:block; margin-top:5px;'>Tienes total acceso a mi panel de control.</span><a href='controlCenter.html' class='chatbot-action-btn'>Ir al Panel de Control <i class='fa-solid fa-arrow-right'></i></a>");
    } else if (responsePayload.email === 'facundotomas018@gmail.com') {
        sessionStorage.setItem('login_greeting', "<strong style='font-size:1.1em; color:#fff;'>Hola Creador</strong><br><span style='color:#ccc;'>Es un gusto volver a verte.</span><br><span style='color:#D90429; font-weight:600; display:block; margin-top:5px;'>Acceso total a mi panel de control permitido !</span><a href='controlCenter.html' class='chatbot-action-btn'>Ir al Panel de Control <i class='fa-solid fa-arrow-right'></i></a>");
    }

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

function loadChatbotGlobal() {
    // 1. Cargar CSS si no existe
    if (!document.querySelector('link[href*="chatbot.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../CSS/chatbot.css';
        document.head.appendChild(link);
    }
    // 2. Cargar JS si no existe
    if (!document.querySelector('script[src*="chatbot.js"]')) {
        const script = document.createElement('script');
        script.src = '../JavaScript/chatbot.js';
        document.body.appendChild(script);
    }
}

function renderLatestDrops() {
    const slider = document.querySelector('.products-slider');
    if (!slider) return;

    // Obtener productos (LocalStorage o MOCK_DB)
    const storedProducts = localStorage.getItem('urbanHustlerProducts');
    const allProducts = storedProducts ? JSON.parse(storedProducts) : (window.MOCK_DB || []);

    // Filtrar SOLO los que tienen la marca isLatestDrop
    let products = allProducts.filter(p => p.isLatestDrop === true);

    // Fallback: Si no hay ningún Drop configurado, mostrar los últimos 5 agregados
    if (products.length === 0) {
        products = [...allProducts].reverse().slice(0, 5);
    } else {
        // Si hay drops, los mostramos en orden inverso (los últimos creados primero)
        products = products.reverse();
    }

    if (products.length === 0) return;

    // Generar HTML de las cards usando los datos reales
    const cardsHTML = products.map(product => `
        <div class="product-card">
            <div class="card-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="card-actions">
                    <button class="btn-shop" onclick="window.location.href='detailProduct.html?id=${product.id}'">Lo Quiero 🔥</button>
                </div>
            </div>
            <div class="card-details">
                <div class="card-header">
                    <h3>${product.name}</h3>
                    <span class="price">$${product.price.toLocaleString()}</span>
                </div>
                <p class="card-desc">${product.description || 'Estilo urbano de alta calidad.'}</p>
                <div class="tags">
                    <span>${(product.category || 'Varios').toUpperCase()}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Duplicar contenido para el efecto de scroll infinito (marquee CSS)
    slider.innerHTML = cardsHTML + cardsHTML;
}