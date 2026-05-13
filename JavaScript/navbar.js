/**
 * Helper global para optimización de imágenes en Cloudinary.
 */
window.optimizeCloudinary = (url, width = 800) => {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return url;
    return url.includes('/upload/') 
        ? url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${width},dpr_auto/`)
        : url;
};

/**
 * Helper global para formateo de precios.
 * Usa Intl.NumberFormat con locale explícito para garantizar
 * que el precio se vea IDÉNTICO en todos los navegadores y dispositivos
 * (iOS Safari, Chrome Android, Firefox, etc.)
 */
window.formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return '$0';
    return '$' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(price);
};

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
    const isControlCenter = window.location.pathname.includes('controlCenter.html') || window.location.pathname.endsWith('/admin');
    if (isControlCenter) {
        // VERIFICACIÓN DE SEGURIDAD PREVIA (Evitar renderizar navbar admin si no es admin)
        const authorizedEmails = ['gimenez.william07@gmail.com', 'facundotomas018@gmail.com'];
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        
        if (!userInfo.email || !authorizedEmails.includes(userInfo.email)) {
            return; // No aplicar cambios de admin, controlCenter.js se encargará de expulsar
        }

        const navList = document.querySelector('.nav-links');
        const navIcons = document.querySelector('.nav-icons');

        // 1. Reemplazar enlaces de tienda por enlaces de administración
        if (navList) {
            navList.innerHTML = ''; // Limpiar menú estándar
            
            const adminLinks = [
                { text: 'Métricas', target: 'view-metrics', icon: 'fa-chart-line' },
                { text: 'Productos', target: 'view-products', icon: 'fa-box' },
                { text: 'Usuarios', target: 'view-users', icon: 'fa-users' },
                { text: 'Experiencia', target: 'view-experience', icon: 'fa-comments' },
                { text: 'Volver a Tienda', href: 'index.html', icon: 'fa-arrow-left' },
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
            // Inyectar estilos CSS dinámicos para el layout del panel y la responsividad
            const styleId = 'admin-layout-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    /* Ocultar elementos de la tienda en el panel */
                    .navbar.admin-mode .logo,
                    .navbar.admin-mode .nav-icons {
                        display: none !important;
                    }
                    /* Estilos de escritorio para el navbar del panel */
                    .navbar.admin-mode .nav-links {
                        display: flex !important;
                        position: static;
                        transform: none;
                        flex-direction: row;
                        background: transparent;
                        padding: 0;
                        margin: 0;
                        gap: 25px;
                        width: auto;
                    }
                    .navbar.admin-mode .menu-toggle {
                        display: none; /* Ocultar hamburguesa en escritorio */
                    }

                    /* Estilos móviles para el panel de control */
                    @media (max-width: 768px) {
                        .navbar.admin-mode {
                            justify-content: flex-start; /* Alinear hamburguesa a la izquierda */
                            padding: 0 1rem;
                        }
                        .navbar.admin-mode .nav-links {
                            display: none !important; /* Ocultar links del navbar en móvil */
                        }
                        .navbar.admin-mode .menu-toggle {
                            display: block; /* Mostrar hamburguesa */
                            color: #fff;
                            display: block !important; /* Forzar mostrar hamburguesa */
                            color: #fff !important;
                            font-size: 1.5rem;
                            background: transparent;
                            border: none;
                            margin: 0;
                            z-index: 1002;
                        }
                        .admin-sidebar {
                            position: fixed;
                            top: 0;
                            width: 220px;
                            max-width: 70vw; /* Más pequeño para móviles */
                            height: 100%;
                            z-index: 1200;
                            transition: transform 0.3s ease;
                            background: #111;
                            box-shadow: 4px 0 15px rgba(0,0,0,0.2);
                            overflow-y: auto;
                            transform: translateX(-100%); /* Oculto fuera de la pantalla */
                        }
                        .admin-sidebar.active {
                            transform: translateX(0);
                        }
                        .admin-content {
                            margin-left: 0 !important; /* Contenido ocupa todo el ancho */
                            padding-top: 80px; /* Espacio para el navbar fijo */
                        }
                        .sidebar-overlay {
                            position: fixed;
                            top: 0; left: 0; width: 100%; height: 100%;
                            background: rgba(0,0,0,0.5);
                            z-index: 1199;
                            opacity: 0;
                            pointer-events: none;
                            transition: opacity 0.3s;
                        }
                        .sidebar-overlay.active {
                            opacity: 1;
                            pointer-events: all;
                        }
                        /* Achicar contenido en móvil */
                        .metrics-grid {
                            grid-template-columns: 1fr;
                        }
                        .orders-table-container {
                            overflow-x: auto;
                        }
                        .modal-content {
                            width: 95%;
                            padding: 1.5rem;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            navbar.classList.add('admin-mode');

            // 1. Eliminar cualquier toggle previo para evitar conflictos
            const existingToggle = navbar.querySelector('.menu-toggle');
            if (existingToggle) existingToggle.remove();

            // 2. Crear botón nuevo y limpio
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'menu-toggle';
            toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            toggleBtn.ariaLabel = "Menú del Panel";
            navbar.prepend(toggleBtn);

            // 3. Crear el overlay para el fondo oscuro si no existe
            const adminContainer = document.querySelector('.admin-container');
            if (adminContainer && !document.querySelector('.sidebar-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.id = 'sidebar-overlay'; // ID explícito para controlCenter.js
                adminContainer.appendChild(overlay);

                overlay.addEventListener('click', () => {
                    document.querySelector('.admin-sidebar')?.classList.remove('active');
                    overlay.classList.remove('active');
                });
            }

            // 4. Listener del botón para abrir el sidebar
            toggleBtn.addEventListener('click', () => {
                document.querySelector('.admin-sidebar')?.classList.add('active');
                const overlay = document.getElementById('sidebar-overlay');
                if(overlay) overlay.classList.add('active');
            });
            
            // Detener la ejecución de setupNavigation para que no aplique la lógica de la tienda
            return;
        }
    }
    // -----------------------------------------------------------

    // --- RECONSTRUCCIÓN DEL MENÚ (LIMPIEZA DE CONTENIDO VIEJO) ---
    const navList = document.querySelector('.nav-links');
    
    // Solo reconstruir si NO estamos en el panel de control (que tiene su propia lógica)
    if (navList && !isControlCenter) {
        navList.innerHTML = ''; // Limpiar cualquier HTML residual (Hombres, Mujeres, etc.)

        const menuItems = [
            { id: 'nav-home', text: 'Home', href: '/' },
            { id: 'nav-new-drops', text: 'New Drops', href: '/#productos-container' },
            { id: 'nav-combos', text: 'Combos', href: '/?category=combos#productos-container' },
            { id: 'nav-offers', text: 'Ofertas 🔥', href: '/?filter=offers#productos-container', style: 'color: #2ecc71;' }
        ];

        menuItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.id = item.id;
            a.textContent = item.text;
            a.href = item.href;
            if (item.style) a.style.cssText = item.style;
            li.appendChild(a);
            navList.appendChild(li);
        });
    }

    // Referencias DOM para lógica posterior
    const navHome = document.getElementById('nav-home');
    const navNewDrops = document.getElementById('nav-new-drops');
    const navOffers = document.getElementById('nav-offers');
    const navCombos = document.getElementById('nav-combos');

    // --- CATEGORÍAS EN NAVBAR ELIMINADAS ---
    // Se movieron a la sección de productos (Home) por solicitud del usuario.
    // navHome se mantiene como enlace simple.

    // --- IMPLEMENTACIÓN CARRITO (SOLO LOGUEADOS) ---
    const navIcons = document.querySelector('.nav-icons');
    const userToken = localStorage.getItem('user_token');
    const existingCartBtn = document.querySelector('.nav-cart-btn');

    if (userToken) {
        // Si hay token y NO existe el botón, lo creamos
        if (navIcons && !existingCartBtn) {
            const cartBtn = document.createElement('a');
            cartBtn.href = "#";
            cartBtn.className = "nav-cart-btn";
            cartBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i><span class="cart-count-badge" style="display:none;">0</span>';
            cartBtn.title = "Tu Carrito";
            
            // Insertar en los iconos (el login se agrega después via initGoogleLogin)
            navIcons.appendChild(cartBtn);
        }
    } else {
        // Si NO hay token y el botón existe, lo BORRAMOS (Limpieza estricta)
        if (existingCartBtn) {
            existingCartBtn.remove();
        }
    }

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
            link.addEventListener('click', (e) => {
                // FIX: Si es un desplegable en móvil, no cerrar el menú principal para permitir ver las opciones
                if (window.innerWidth <= 768 && link.parentElement.classList.contains('nav-item-dropdown')) {
                    return;
                }
                navLinks.classList.remove('active');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
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
    // ELIMINADO: El buscador se movió a la sección de productos.
    const searchContainer = document.querySelector('.nav-search-container');
    if (searchContainer) searchContainer.remove(); // Asegurar que no quede rastro en el DOM

    const isHome = document.body.classList.contains('home-page');
    const isCatalog = document.body.classList.contains('catalog-page');

    if (isHome) {
        // Lógica para la Home (Evita recarga y filtra dinámicamente)
        const applyHomeFilter = (e, filterValue) => {
            e.preventDefault();
            window.latestDropsFilter = filterValue;
            
            // Sincronizar el dropdown visualmente
            const select = document.getElementById('category-filter-select');
            if (select) {
                select.value = filterValue;
                // Si el valor no existe (ej. 'new-drops'), poner 'all'
                if (select.selectedIndex === -1) {
                    select.value = 'all';
                    window.latestDropsFilter = 'all';
                }
            }
            
            // Renderizar productos
            renderLatestDrops();
            
            // Scroll a la sección de productos para feedback visual
            const productsContainer = document.getElementById('productos-container');
            if (productsContainer) {
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            }
        };

        // Asignar los eventos a los enlaces del navbar
        if (navOffers) navOffers.addEventListener('click', (e) => applyHomeFilter(e, 'offers'));
        if (navCombos) navCombos.addEventListener('click', (e) => applyHomeFilter(e, 'combos'));
        // 'New Drops' simplemente scrollea y muestra 'Todo'
        if (navNewDrops) navNewDrops.addEventListener('click', (e) => applyHomeFilter(e, 'all'));
    } else {
        // Lógica por defecto (Home, Detalle, etc.)
        // Configurar enlaces para redirigir al catálogo con parámetros
        if (navNewDrops) navNewDrops.href = "index.html#productos-container";
        if (navOffers) navOffers.href = "index.html?filter=offers#productos-container";
        if (navCombos) navCombos.href = "index.html?category=combos#productos-container";
    }

    // --- LÓGICA DEL NAVBAR DINÁMICO (Scroll) ---
    // Usamos un nombre distinto para evitar conflictos de variables o referencias nulas
    const navbarElement = document.querySelector('.navbar');
    if (navbarElement) {
        const updateNavbar = () => {
            if (window.scrollY > 20) {
                navbarElement.classList.add('scrolled');
            } else {
                navbarElement.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', updateNavbar);
        // Chequeo inicial
        updateNavbar();
    }
}

// --- LÓGICA DE REGISTRO DE VENTAS ---
function initSalesLogic() {
    document.addEventListener('click', (e) => {
        // Detectar clic en el botón de checkout
        const checkoutBtn = e.target.closest('.btn-checkout');
        if (checkoutBtn) {
            console.log("🛒 Procesando venta...");
            
            const totalElement = document.querySelector('.cart-total span:last-child');
            const cartItems = document.querySelectorAll('.cart-item');
            
            if (totalElement && cartItems.length > 0) {
                // Obtener total limpio (sin $ ni puntos)
                const totalRaw = totalElement.textContent.replace(/[^\d]/g, '');
                const total = parseFloat(totalRaw);

                // Obtener items
                const items = Array.from(cartItems).map(item => {
                    const name = item.querySelector('h4').textContent;
                    const qtyEl = item.querySelector('.cart-item-controls span');
                    const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
                    return { name, quantity: qty };
                });

                const newOrder = {
                    id: Date.now(),
                    date: new Date().toISOString(),
                    total: total,
                    items: items,
                    customer: 'Cliente Web', // Se podría mejorar con datos de sesión
                    status: 'pending'
                };

                // Guardar en historial persistente
                const orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
                orders.push(newOrder);
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
            }
        }
    });
}

// --- LÓGICA SECCIÓN EXPERIENCIA (HOME) con CARRUSEL DE FOTOS ---
function renderHomeExperience() {
    const portadas = document.getElementById('portadas-container');
    // Solo renderizar si existe la sección de portadas (estamos en home) y no se ha creado ya
    if (!portadas || document.getElementById('home-experience-section')) return;

    const experienceContainer = document.createElement('section');
    experienceContainer.id = 'home-experience-section';
    experienceContainer.style.marginTop = '0';
    
    // Estructura con CARRUSEL RESPONSIVO
    experienceContainer.innerHTML = `
        <div class="catalog-break-content" style="display: flex; flex-direction: column; gap: 0; padding: 0; background: #111; align-items: stretch;">
            <!-- TICKER TEXTO CORRIENDO -->
            <div class="ticker-container">
                <div class="ticker-text">
                    <span>no te lo pierdas !</span>
                    <span class="ticker-separator">•</span>
                    <span>seguinos en instagram @urbanhustler_indumentaria</span>
                    <span class="ticker-separator">•</span>
                </div>
            </div>
            
            <!-- TÍTULO GRADIENTE ANIMADO -->
            <section class="gradient-title-section">
                <h2 class="gradient-title">
                    <span class="gradient-word">NEW</span>
                    <span class="gradient-word">DROPS</span>
                </h2>
                <div class="title-decoration">
                    <div class="decoration-line"></div>
                    <div class="decoration-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="decoration-line"></div>
                </div>
            </section>
            
            <!-- CONTENEDOR CARRUSEL + COMENTARIOS -->
            <div class="content-row" style="display: flex; gap: 30px; align-items: center;">
                <!-- CARRUSEL DE FOTOS -->
                <div class="mobile-gallery-section-home" style="flex: 1; display: flex; justify-content: center; align-items: center;">
                    <div class="mobile-device-carousel-home" id="homeDeviceCarousel">
                        <div class="mobile-device">
                            <div class="mobile-device-screen">
                                <div class="mobile-slider">
                                    <div class="mobile-slide active" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (1).jpeg" alt="Look 1">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (2).jpeg" alt="Look 2">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (3).jpeg" alt="Look 3">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (4).jpeg" alt="Look 4">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (5).jpeg" alt="Look 5">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (6).jpeg" alt="Look 6">
                                    </div>
                                    <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                        <img src="/img/img 1 (7).jpeg" alt="Look 7">
                                    </div>
                                </div>
                                <div class="mobile-dots"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- CONTENEDOR DE COMENTARIOS -->
                <div class="break-comments" style="flex: 1; min-width: 300px; max-width: 500px; background: #1A1A1A; padding: 30px; border-radius: 12px; border: 1px solid #333;">
                    <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.5rem;">Cuéntanos tu experiencia</h3>
                    <p style="color: #888; margin-bottom: 20px;">Tu opinión nos ayuda a mejorar y a crear el mejor estilo urbano.</p>
                    <form class="comment-form" style="display: flex; flex-direction: column; gap: 15px;">
                        <input type="text" id="comment-name" placeholder="Tu nombre" required style="padding: 12px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px; outline: none;">
                        <textarea id="comment-text" placeholder="Comparte tu opinión..." required style="padding: 12px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px; min-height: 100px; outline: none; resize: vertical;"></textarea>
                        <button type="submit" style="padding: 12px; background: #2ecc71; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.3s; text-transform: uppercase;">Enviar Comentario</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Insertar justo después de las portadas
    portadas.parentNode.insertBefore(experienceContainer, portadas.nextSibling);

    // Inicializar carrusel de fotos
    initMobileCarousel('homeDeviceCarousel');

    // Lógica del formulario
    const form = experienceContainer.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('comment-name').value.trim();
        const textVal = document.getElementById('comment-text').value.trim();
        if (!nameVal || !textVal) return;
        const newComment = { id: Date.now(), name: nameVal, text: textVal, date: new Date().toISOString() };
        const comments = JSON.parse(localStorage.getItem('urbanHustlerComments')) || [];
        comments.push(newComment);
        localStorage.setItem('urbanHustlerComments', JSON.stringify(comments));
        if (window.firebaseManager) window.firebaseManager.saveComment(newComment);
        alert('¡Gracias por compartir tu experiencia con UrbanHustler!');
        form.reset();
    });
}

// Inicialización de componentes
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Navbar
    
    // 0. Cargar Firebase Manager (Base de Datos Real)
    if (!document.querySelector('script[src*="firebase.js"]')) {
        const fbScript = document.createElement('script');
        fbScript.src = '/JavaScript/firebase.js';
        fbScript.defer = true;
        document.head.appendChild(fbScript);
    }

    await UIComponentLoader.loadComponent('navbar-container', '../HTML/navbar.html');
    setupNavigation();
    
    // Inicializar Login de Google en el Navbar
    initGoogleLogin();

    // Inicializar Lógica de Ventas
    initSalesLogic();

    // Notificar al sistema que el navbar está listo
    document.dispatchEvent(new Event('app:navbar-loaded'));

    // Cargar Carrusel
    if (document.getElementById('carousel-container')) {
        await UIComponentLoader.loadComponent('carousel-container', '../HTML/carousel.html');
        if (typeof initCarousel === 'function') {
            initCarousel();
        }
    }

    // Cargar Sección de Redes Sociales
    if (document.getElementById('social-media-container')) {
        await UIComponentLoader.loadComponent('social-media-container', '../HTML/SocialMedia.html');
        // La función initSocialMedia se encarga de las animaciones de la nueva sección.
        if (typeof initSocialMedia === 'function') {
            initSocialMedia();
        }
    }

    // Cargar Sección de Portadas
    if (document.getElementById('portadas-container')) {
        await UIComponentLoader.loadComponent('portadas-container', '/HTML/portadas.html');
        if (typeof initPortadas === 'function') {
            initPortadas();
        }
        
        // Inyectar sección de Experiencia (Comentarios) debajo de portadas
        renderHomeExperience();
    }

    // Cargar Sección de Productos (Latest Drops integrada en index)
    if (document.getElementById('productos-container')) {
        // Asegurar que MOCK_DB esté disponible antes de renderizar
        const waitForMockDB = async () => {
            let attempts = 0;
            while (!window.MOCK_DB && attempts < 50) { // Esperar máximo 5 segundos
                console.log("⏳ Esperando a que MOCK_DB esté disponible...");
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.MOCK_DB) {
                console.error("❌ MOCK_DB no se cargó. Intentando cargar data.js manualmente...");
                // Si aún no está disponible, cargar data.js dinámicamente
                return new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = '/JavaScript/data.js';
                    script.onload = () => {
                        console.log("✅ data.js cargado dinámicamente. MOCK_DB:", !!window.MOCK_DB);
                        resolve();
                    };
                    document.head.appendChild(script);
                });
            } else {
                console.log("✅ MOCK_DB está disponible, procediendo con renderización...");
            }
        };

        // Leer filtros de URL antes de renderizar para aplicar selección del navbar
        const params = new URLSearchParams(window.location.search);
        if (params.has('category')) window.latestDropsFilter = params.get('category');
        if (params.has('filter') && params.get('filter') === 'offers') window.latestDropsFilter = 'offers';

        // Renderizar productos dinámicos (Latest Drops) desde la base de datos
        await waitForMockDB();
        await renderLatestDrops();

        // Actualizar cuando Firebase esté listo
        document.addEventListener('firebase-ready', () => {
            renderLatestDrops();
        });
    }

    // Cargar Sección de Ubicación
    if (document.getElementById('ubicacion-container')) {
        await UIComponentLoader.loadComponent('ubicacion-container', '/HTML/ubicacion.html');
        if (typeof initUbicacion === 'function') {
            initUbicacion();
        }
    }

    // Cargar Sección de Newsletter
    if (document.getElementById('newsletter-container')) {
        await UIComponentLoader.loadComponent('newsletter-container', '../HTML/newsletter.html');
        if (typeof initNewsletter === 'function') {
            initNewsletter();
        }
    }

    // Cargar Sección de Footer (solo si existe el contenedor)
    if (document.getElementById('footer-container')) {
        await UIComponentLoader.loadComponent('footer-container', '../HTML/footer.html');
    }

    // Cargar Chatbot Globalmente (EXCEPTO en el Panel de Control)
    const isControlCenter = window.location.pathname.includes('controlCenter.html') || window.location.pathname.endsWith('/admin');
    if (!isControlCenter) {
        loadChatbotGlobal();
    }

    // --- INICIALIZAR ANIMACIONES DE SCROLL ---
    initScrollAnimations();
});

function initSocialMedia() {
    const section = document.querySelector('.ig-section');
    if (!section) {
        console.warn('[initSocialMedia] No se encontró el contenedor .ig-section para animar.');
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // Animar solo una vez para mejor rendimiento
            }
        });
    }, { 
        threshold: 0.15 // Iniciar animación cuando el 15% de la sección es visible
    });

    observer.observe(section);
}

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
    // ID de cliente OAuth proporcionado por Google
    const clientId = "832225793734-b267cqm3saeioj5e30fecja196msjapr.apps.googleusercontent.com";

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
    
    // LIMPIEZA CRÍTICA: Borrar caché de productos para liberar espacio y permitir guardar la sesión
    localStorage.removeItem('urbanHustlerProducts');

    // Guardar sesión
    localStorage.setItem('user_token', response.credential);
    localStorage.setItem('user_info', JSON.stringify(responsePayload));
    
    // Guardar usuario en localStorage para el panel de control
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('urbanHustlerUsers'));
        if (!Array.isArray(users)) users = [];
    } catch (e) {
        users = [];
    }

    const existingIndex = users.findIndex(u => u.email === responsePayload.email);
    
    const userData = {
        email: responsePayload.email,
        name: responsePayload.name || 'Usuario Google',
        picture: responsePayload.picture, // Guardar foto si existe
        source: 'google',
        date: new Date().toISOString()
    };

    if (existingIndex > -1) {
        users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
        users.push(userData);
    }
    localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));

    // --- GUARDAR EN NUBE (FIREBASE) ---
    if (window.firebaseManager) {
        window.firebaseManager.signInWithGoogle(response.credential).then(() => {
            window.firebaseManager.saveUser(userData);
        });
    }

    // Mensajes personalizados por usuario (Admin / Creador)
    if (responsePayload.email === 'gimenez.william07@gmail.com') {
        sessionStorage.setItem('login_greeting', "<strong style='font-size:1.1em; color:#fff;'>Hola Wiliam</strong><br><span style='color:#ccc;'>Soy tu asistente inteligente.</span><br><span style='color:#2ecc71; font-weight:600; display:block; margin-top:5px;'>Tienes total acceso a mi panel de control.</span><a href='/admin' class='chatbot-action-btn'>Ir al Panel de Control <i class='fa-solid fa-arrow-right'></i></a>");
    } else if (responsePayload.email === 'facundotomas018@gmail.com') {
        sessionStorage.setItem('login_greeting', "<strong style='font-size:1.1em; color:#fff;'>Hola Creador</strong><br><span style='color:#ccc;'>Es un gusto volver a verte.</span><br><span style='color:#2ecc71; font-weight:600; display:block; margin-top:5px;'>Acceso total a mi panel de control permitido !</span><a href='/admin' class='chatbot-action-btn'>Ir al Panel de Control <i class='fa-solid fa-arrow-right'></i></a>");
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
        link.href = '/CSS/chatbot.css';
        document.head.appendChild(link);
    }
    // 2. Cargar JS si no existe
    if (!document.querySelector('script[src*="chatbot.js"]')) {
        const script = document.createElement('script');
        script.src = '/JavaScript/chatbot.js';
        document.body.appendChild(script);
    }
}

async function renderLatestDrops() {
    const container = document.getElementById('home-products-grid');
    console.log("🔍 [renderLatestDrops] INICIADO. Contenedor encontrado:", !!container);

    if (!container) {
        console.error("❌ Contenedor 'home-products-grid' no encontrado");
        return;
    }

    // 1. Mostrar spinner de carga inmediatamente
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; grid-column: 1 / -1; gap: 20px;">
            <div class="spinner-loader" style="width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #2ecc71; border-radius: 50%; animation: spin-loader 1s linear infinite;"></div>
            <p style="color: #888; font-size: 1rem;">Cargando...</p>
        </div>
        <style> @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } </style>
    `;

    // Función interna para no repetir la lógica de obtención de datos
    const fetchProducts = async () => {
        let products = [];
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            const cloudProducts = await window.firebaseManager.getCollection('products');
            if (cloudProducts && cloudProducts.length > 0) products = cloudProducts;
        }
        if (products.length === 0) {
            const stored = localStorage.getItem('urbanHustlerProducts');
            if (stored) {
                try { products = JSON.parse(stored); } catch (e) { console.error("Error parseando localStorage"); }
            }
        }
        return products;
    };

    // Función interna para no repetir la lógica de renderizado
    const renderCards = (productsToRender) => {
        let products = [...productsToRender];
        const currentFilter = window.latestDropsFilter || 'all';

        if (window.latestDropsSearch && window.latestDropsSearch.trim() !== '') {
            const term = window.latestDropsSearch.toLowerCase().trim();
            products = products.filter(p => p.name.toLowerCase().includes(term));
        }

        if (currentFilter === 'offers') {
            products = products.filter(p => p.isOffer === true);
        } else if (currentFilter !== 'all') {
            products = products.filter(p => p.category === currentFilter);
        } else {
            products = products.sort(() => 0.5 - Math.random());
        }

        console.log("🔍 [renderLatestDrops] Productos después de filtro:", products.length);

        if (products.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px;">⚠️ No se encontraron productos con esos filtros.</p>';
            return;
        }

        products = products.filter(p => p.id !== undefined && p.id !== null);
        console.log(`🔍 [renderLatestDrops] Validación de IDs: ${products.length} productos`);

        if (products.length === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px;">⚠️ Error: productos sin IDs válidos</p>';
            return;
        }

        console.log("✅ Renderizando", products.length, "productos con optimización");
        const cardsHTML = products.map((product, index) => {
            const safeId = String(product.id);
            const href = product.slug ? `/producto/${product.slug}` : `/HTML/detailProduct.html?id=${safeId}`;
            
            // Optimización LCP: Primeras 2 imágenes cargan con prioridad alta
            const optimizedImg = window.optimizeCloudinary(product.image, 500);
            const loadingAttr = index < 2 ? 'eager' : 'lazy';
            const priorityAttr = index < 2 ? 'fetchpriority="high"' : '';

            return `
            <div class="product-card" onclick="window.location.href='${href}'" style="cursor: pointer;">
                <div class="card-image">
                    <img src="${optimizedImg}" alt="${product.name}" 
                         width="400" height="400" 
                         loading="${loadingAttr}" ${priorityAttr} decoding="async">
                    <div class="card-actions">
                        <button class="btn-shop" onclick="event.stopPropagation(); window.location.href='${href}'">Lo Quiero 🔥</button>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-header">
                        <h3>${product.name}</h3>
                        <span class="price">${window.formatPrice(product.price)}</span>
                    </div>
                    <p class="card-desc">${product.description || 'Estilo urbano de alta calidad.'}</p>
                    <div class="tags">
                        <span>${(product.category || 'Varios').toUpperCase()}</span>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        container.innerHTML = cardsHTML;
        console.log("✅ [renderLatestDrops] COMPLETADO - Cards renderizadas exitosamente en el DOM");
    };

    // Lógica principal de carga
    let initialProducts = await fetchProducts();

    if (initialProducts.length > 0) {
        renderCards(initialProducts);
    } else {
        // Si no hay productos, verificar si Firebase está cargando
        if (window.firebaseManager && !window.firebaseManager.isInitialized) {
            console.log("⏳ [Home] Caché vacía. Esperando conexión a Nube...");
            // El spinner ya está visible, el evento 'firebase-ready' se encargará.
            return;
        }

        // Si Firebase ya cargó y no hay nada, iniciar reintento de 3 segundos
        console.log("⏳ [Home] No se encontraron productos. Iniciando reintento en 3s...");
        const p = container.querySelector('p');
        if (p) p.textContent = "Sincronizando con la base de datos...";

        setTimeout(async () => {
            const finalProducts = await fetchProducts();
            if (finalProducts.length > 0) {
                console.log("✅ [Home] Productos encontrados tras la sincronización.");
                renderCards(finalProducts);
            } else {
                console.error("❌ [Home] Sincronización fallida. No hay productos.");
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px;">⚠️ No hay productos para mostrar. Agrega productos desde el Panel de Control.</p>';
            }
        }, 3000);
    }
}

// --- Filtros de Latest Drops en Home ---
function initHomeProductsFilter() {
    const filterBar = document.querySelector('.products-filter-bar');
    if (!filterBar) return;

    // 1. Recuperar Categorías Dinámicas (Sincronizado con Panel de Control)
    const categories = JSON.parse(localStorage.getItem('urbanHustlerCategories')) || [
        { id: 'hoodie', name: 'Hoodie' },
        { id: 'pants', name: 'Pantalones' },
        { id: 'tshirt', name: 'Remeras' },
        { id: 'accessories', name: 'Accesorios' }
    ];

    // 2. Construir Opciones del Dropdown
    let optionsHTML = '<option value="all">Todo</option>';
    
    categories.forEach(cat => {
        optionsHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });

    optionsHTML += '<option value="offers">Ofertas 🔥</option>';

    // Inyectar HTML del Buscador y Categorías directamente en la barra
    filterBar.innerHTML = `
        <div class="filter-ui-container" style="display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 800px; margin: 0 auto 30px auto;">
            
            <!-- Buscador -->
            <div class="search-box" style="position: relative; width: 100%; max-width: 500px;">
                <input type="text" id="section-search-input" placeholder="Buscar por nombre..." 
                    style="width: 100%; padding: 12px 45px 12px 20px; border-radius: 30px; border: 1px solid #333; background: #1a1a1a; color: #fff; outline: none; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: border-color 0.3s;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #888;"></i>
            </div>

            <!-- Dropdown de Categorías -->
            <div class="category-select-wrapper" style="position: relative; width: 100%; max-width: 300px;">
                <select id="category-filter-select" style="width: 100%; padding: 12px 45px 12px 20px; border-radius: 30px; border: 1px solid #444; background: #1a1a1a; color: #ccc; outline: none; font-size: 1rem; appearance: none; cursor: pointer; transition: border-color 0.3s;">
                    ${optionsHTML}
                </select>
                <i class="fa-solid fa-chevron-down" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none;"></i>
            </div>
        </div>
        
        <style>
            #category-filter-select:hover, #category-filter-select:focus {
                border-color: #fff; color: #fff;
            }
            #section-search-input:focus { border-color: #888 !important; }
        </style>
    `;

    // Estado inicial
    window.latestDropsFilter = window.latestDropsFilter || 'all';
    window.latestDropsSearch = '';

    // Sincronizar select con estado actual
    const select = document.getElementById('category-filter-select');
    if (select) {
        select.value = window.latestDropsFilter;
        // Fallback si el valor no existe en las opciones (ej: URL antigua)
        if (select.selectedIndex === -1) select.value = 'all';
    }

    // LÓGICA 1: Búsqueda por Texto
    const searchInput = document.getElementById('section-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.latestDropsSearch = e.target.value;
            renderLatestDrops();
        });
    }

    // LÓGICA 2: Filtros por Categoría (Select Change)
    if (select) {
        select.addEventListener('change', (e) => {
            window.latestDropsFilter = e.target.value;
            renderLatestDrops();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('home-page')) {
        initHomeProductsFilter();
    }
});
