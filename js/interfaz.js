/**
 * INTERFAZ GENERAL (Barra de navegación, Pie de página, Menú móvil y Carrusel táctil)
 */

function configurarBarraNavegacion() {
    const rutaActual = window.location.pathname;
    const esPanelAdmin = rutaActual.includes('/admin/') || rutaActual.includes('panel.html') || rutaActual.endsWith('/admin');

    if (esPanelAdmin) {
        if (!window.esUsuarioAdministrador || !window.esUsuarioAdministrador()) return;

        // Ocultar marquesina pública en el panel administrativo
        document.querySelector('.announcement-bar')?.remove();

        const navList = document.querySelector('.nav-links');
        const navIcons = document.querySelector('.nav-icons');
        const navbar = document.querySelector('.navbar');
        const logo = document.querySelector('.navbar .logo');

        if (logo) {
            logo.innerHTML = 'URBANHUSTLER <span class="admin-badge-header">ADMIN</span>';
            logo.href = '/admin/panel.html';
        }

        if (navList) {
            navList.innerHTML = '';
        }

        if (navIcons) {
            navIcons.innerHTML = `
                <a href="/index.html" class="admin-store-link" title="Ir a la tienda">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> <span>VER TIENDA</span>
                </a>
            `;
            navIcons.style.display = 'flex';
        }

        if (navbar) {
            navbar.classList.add('admin-mode');
            const existingToggle = navbar.querySelector('.menu-toggle');
            if (existingToggle) existingToggle.remove();

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'menu-toggle';
            toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            toggleBtn.ariaLabel = 'Menú del Panel';
            navbar.prepend(toggleBtn);

            const adminContainer = document.querySelector('.admin-container');
            if (adminContainer && !document.querySelector('.sidebar-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.id = 'sidebar-overlay';
                adminContainer.appendChild(overlay);

                overlay.addEventListener('click', () => {
                    document.querySelector('.admin-sidebar')?.classList.remove('active');
                    overlay.classList.remove('active');
                });
            }

            toggleBtn.addEventListener('click', () => {
                document.querySelector('.admin-sidebar')?.classList.toggle('active');
                document.getElementById('sidebar-overlay')?.classList.toggle('active');
            });
        }
        return;
    }

    // Configurar menú móvil en tienda pública
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');

    if (navbar && navLinks && !document.querySelector('.menu-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        toggleBtn.ariaLabel = 'Menú';
        navbar.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = navLinks.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });

        window.addEventListener('scroll', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // Filtros rápidos desde la barra cuando estamos en la portada
    const esPortada = document.body.classList.contains('home-page');
    if (esPortada) {
        const navNewDrops = document.getElementById('nav-new-drops');
        const navCombos = document.getElementById('nav-combos');
        const navOffers = document.getElementById('nav-offers');

        const aplicarFiltroPortada = (e, filtro) => {
            e.preventDefault();
            if (typeof window.setCatalogFilter === 'function') {
                window.setCatalogFilter(filtro);
            } else {
                window.latestDropsFilter = filtro;
                if (typeof window.renderLatestDrops === 'function') {
                    window.renderLatestDrops();
                }
            }
            document.getElementById('productos-container')?.scrollIntoView({ behavior: 'smooth' });
        };

        if (navNewDrops) navNewDrops.addEventListener('click', (e) => aplicarFiltroPortada(e, 'all'));
        if (navCombos) navCombos.addEventListener('click', (e) => aplicarFiltroPortada(e, 'combos'));
        if (navOffers) navOffers.addEventListener('click', (e) => aplicarFiltroPortada(e, 'offers'));
    }

    // Efecto de barra al hacer scroll
    if (navbar) {
        const actualizarScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        };
        window.addEventListener('scroll', actualizarScroll);
        actualizarScroll();
    }
}

window.iniciarAnimacionesScroll = function () {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('portada-item')) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.add('active');
                }
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section-title, .portada-item, .info-card, .social-title').forEach(el => {
        if (!el.classList.contains('portada-item')) {
            el.classList.add('reveal-up');
        }
        observer.observe(el);
    });
};

// Carrusel táctil reutilizable para dispositivos móviles
window.initMobileCarousel = function (carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const screen = carousel.querySelector('.mobile-device-screen');
    const slides = Array.from(carousel.querySelectorAll('.mobile-slide'));
    const dotsContainer = carousel.querySelector('.mobile-dots');
    if (!screen || slides.length === 0 || !dotsContainer) return;

    dotsContainer.innerHTML = '';
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let isAnimating = false;
    const swipeLimit = 55;

    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('mobile-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
        if (index === currentIndex) dot.classList.add('active');
        dot.addEventListener('click', () => {
            if (index !== currentIndex && !isAnimating) goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll('.mobile-dot'));

    function updateDots() {
        dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
    }

    function cleanClasses() {
        slides.forEach(s => s.classList.remove('active', 'prev-out', 'next-out', 'prev-in', 'next-in'));
    }

    function goToSlide(newIndex) {
        if (isAnimating) return;
        const oldIndex = currentIndex;
        if (newIndex < 0) newIndex = slides.length - 1;
        if (newIndex >= slides.length) newIndex = 0;
        if (newIndex === oldIndex) return;

        isAnimating = true;
        const oldSlide = slides[oldIndex];
        const newSlide = slides[newIndex];
        const goingForward = newIndex > oldIndex || (oldIndex === slides.length - 1 && newIndex === 0);

        slides.forEach(s => s.classList.remove('prev-out', 'next-out', 'prev-in', 'next-in'));

        if (goingForward) {
            newSlide.classList.add('next-in');
            requestAnimationFrame(() => {
                oldSlide.classList.remove('active');
                oldSlide.classList.add('prev-out');
                newSlide.classList.remove('next-in');
                newSlide.classList.add('active');
            });
        } else {
            newSlide.classList.add('prev-in');
            requestAnimationFrame(() => {
                oldSlide.classList.remove('active');
                oldSlide.classList.add('next-out');
                newSlide.classList.remove('prev-in');
                newSlide.classList.add('active');
            });
        }

        currentIndex = newIndex;
        updateDots();

        setTimeout(() => {
            cleanClasses();
            slides[currentIndex].classList.add('active');
            isAnimating = false;
        }, 460);
    }

    screen.addEventListener('touchstart', (e) => {
        if (isAnimating) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        currentX = startX;
        screen.classList.add('is-dragging');
    }, { passive: true });

    screen.addEventListener('touchmove', (e) => {
        if (isDragging && !isAnimating) currentX = e.touches[0].clientX;
    }, { passive: true });

    const finishDrag = () => {
        if (!isDragging || isAnimating) return;
        const diff = currentX - startX;
        if (diff > swipeLimit) goToSlide(currentIndex + 1);
        else if (diff < -swipeLimit) goToSlide(currentIndex - 1);
        isDragging = false;
        screen.classList.remove('is-dragging');
    };

    screen.addEventListener('touchend', finishDrag);
    screen.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (isAnimating) return;
        isDragging = true;
        startX = e.clientX;
        currentX = startX;
        screen.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', (e) => {
        if (isDragging && !isAnimating) currentX = e.clientX;
    });
    window.addEventListener('mouseup', finishDrag);

    cleanClasses();
    slides[currentIndex].classList.add('active');
    updateDots();
};

// Inicialización automática de Barra y Pie de página
document.addEventListener('DOMContentLoaded', async () => {
    await window.CargadorComponentes.loadComponent('navbar-container', '/componentes/barra.html');
    configurarBarraNavegacion();

    if (typeof window.iniciarSesionGoogle === 'function') {
        window.iniciarSesionGoogle();
    }

    document.dispatchEvent(new Event('app:navbar-loaded'));

    if (document.getElementById('footer-container')) {
        await window.CargadorComponentes.loadComponent('footer-container', '/componentes/pie.html');
    }

    window.iniciarAnimacionesScroll();
});

