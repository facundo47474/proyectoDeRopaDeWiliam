/**
 * SERVICE: Capa de Servicios (Data Fetching)
 * Simula una API REST.
 */
class ProductService {
    async fetchProducts() {
        return new Promise(resolve => {
            // 1. Intentar cargar desde LocalStorage (Datos editados por Admin)
            const storedProducts = localStorage.getItem('urbanHustlerProducts');
            if (storedProducts) {
                resolve(JSON.parse(storedProducts));
                return;
            }

            // Verificamos que MOCK_DB exista para evitar errores
            if (typeof MOCK_DB === 'undefined') {
                console.error("Error: MOCK_DB no está definido. Asegúrate de cargar data.js");
                resolve([]);
                return;
            }
            setTimeout(() => resolve([...MOCK_DB]), 300);
        });
    }
}

/**
 * MODELO: Gestiona los datos y la lógica de negocio (filtrado)
 */
class ProductModel {
    constructor() {
        this.products = [];
        this.filters = {
            category: 'all',
            gender: 'all',
            maxPrice: 100000,
            searchTerm: '',
            isOffer: false
        };
    }

    setProducts(products) {
        this.products = products;
    }

    updateFilter(key, value) {
        if (Object.prototype.hasOwnProperty.call(this.filters, key)) {
            this.filters[key] = value;
        }
    }

    getFilteredProducts() {
        return this.products.filter(product => {
            const catMatch = this.filters.category === 'all' || product.category === this.filters.category;
            const genderMatch = this.filters.gender === 'all' || product.gender === this.filters.gender;
            const priceMatch = product.price <= this.filters.maxPrice;
            const term = this.filters.searchTerm.toLowerCase();
            const searchMatch = product.name.toLowerCase().includes(term);
            const offerMatch = !this.filters.isOffer || product.isOffer === true;
            return catMatch && genderMatch && priceMatch && searchMatch && offerMatch;
        });
    }
}

/**
 * VISTA: Se encarga exclusivamente del DOM y de mostrar HTML
 */
class ProductView {
    constructor() {
        this.grid = document.getElementById('catalog-grid');
    }

    render(products) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (products.length === 0) {
            this.grid.innerHTML = '<div class="no-results" style="opacity:0; animation: fadeIn 0.5s forwards;">No se encontraron productos con esos filtros.</div>';
            return;
        }

        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Animación en cascada dinámica (Staggered)
            // Limitamos el delay máximo a 800ms para no hacer esperar demasiado al usuario
            const delay = Math.min(index * 100, 800);
            card.style.animationDelay = `${delay}ms`;

            card.innerHTML = `
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="card-actions">
                        <button class="btn-shop" onclick="animateAndRedirect(this, 'detailProduct.html?id=${product.id}')">Comprar Ahora</button>
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
                        ${product.isOffer ? '<span style="background: #D90429; color: #fff; border: none;">OFERTA</span>' : ''}
                    </div>
                </div>
            `;
            
            // Agregar efecto Tilt 3D (Vida y Movimiento)
            this.attachTiltEffect(card);

            this.grid.appendChild(card);

            // Inyectar sección intermedia después de la 4ta tarjeta (índice 3)
            if (index === 3) {
                const breakSection = document.createElement('div');
                breakSection.className = 'catalog-break-section';
                breakSection.style.animationDelay = `${(index + 1) * 100}ms`; // Delay secuencial
                breakSection.innerHTML = `
                    <span></span><span></span><span></span><span></span>
                    <div class="catalog-break-content">
                        <div class="break-video">
                            <video autoplay muted loop playsinline>
                                <source src="../video.mp4/catalogo1.mp4" type="video/mp4">
                            </video>
                            <button class="break-sound-toggle" aria-label="Activar sonido">
                                <i class="fa-solid fa-volume-xmark"></i>
                            </button>
                        </div>
                        <div class="break-comments">
                            <h3>Cuéntanos tu experiencia</h3>
                            <p>Tu opinión nos ayuda a mejorar y a crear el mejor estilo urbano.</p>
                            <form class="comment-form">
                                <input type="text" placeholder="Tu nombre" required>
                                <textarea placeholder="Comparte tu opinión..." required></textarea>
                                <button type="submit">Enviar Comentario</button>
                            </form>
                        </div>
                    </div>
                `;

                // Agregar funcionalidad simple al formulario
                const form = breakSection.querySelector('form');
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('¡Gracias por compartir tu experiencia con UrbanHustler!');
                    form.reset();
                });

                // Lógica para el botón de sonido
                const video = breakSection.querySelector('video');
                const soundBtn = breakSection.querySelector('.break-sound-toggle');

                if (video && soundBtn) {
                    soundBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        video.muted = !video.muted;
                        soundBtn.innerHTML = video.muted ?
                            '<i class="fa-solid fa-volume-xmark"></i>' :
                            '<i class="fa-solid fa-volume-high"></i>';
                    });

                    // Observer para pausar el video cuando sale de pantalla
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (!entry.isIntersecting) {
                                video.pause(); // Detiene video y audio al salir
                            } else {
                                video.play().catch(() => { }); // Reanuda al volver a entrar
                            }
                        });
                    }, { threshold: 0.2 }); // Se activa cuando el 20% es visible

                    observer.observe(breakSection);
                }

                this.grid.appendChild(breakSection);
            }
        });
    }

    /**
     * Agrega un efecto de inclinación 3D (Tilt) a la tarjeta basado en el mouse.
     */
    attachTiltEffect(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calcular rotación basada en la posición del cursor
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Intensidad de la rotación (grados)
            const rotateX = ((y - centerY) / centerY) * -8; 
            const rotateY = ((x - centerX) / centerX) * 8;

            // Aplicar transformación con perspectiva
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            
            // Sombra dinámica opuesta a la luz
            const shadowX = (x - centerX) / 10;
            const shadowY = (y - centerY) / 10;
            card.style.boxShadow = `${-shadowX}px ${-shadowY}px 20px rgba(0,0,0,0.4)`;
            
            // Transición rápida para seguimiento fluido
            card.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
        });

        card.addEventListener('mouseleave', () => {
            // Resetear al salir
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'; // Sombra base
            card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
        });
    }
}

/**
 * CONTROLADOR: Coordina el Modelo y la Vista
 */
class ProductController {
    constructor(model, view, service) {
        this.model = model;
        this.view = view;
        this.service = service;
    }

    async init() {
        // 1. Cargar datos
        const products = await this.service.fetchProducts();
        this.model.setProducts(products);

        // 2. Leer parámetros URL para filtros iniciales
        const params = new URLSearchParams(window.location.search);
        if (params.has('gender')) {
            this.model.updateFilter('gender', params.get('gender'));
        }
        if (params.has('maxPrice')) {
            this.model.updateFilter('maxPrice', parseInt(params.get('maxPrice')));
        }
        if (params.has('isOffer')) {
            this.model.updateFilter('isOffer', params.get('isOffer') === 'true');
        }

        // 3. Render inicial
        this.updateDisplay();

        // 4. Configurar Event Listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('app:filter-change', (e) => {
            const { key, value } = e.detail;
            this.model.updateFilter(key, value);
            this.updateDisplay();
        });
    }

    updateDisplay() {
        const filtered = this.model.getFilteredProducts();
        this.view.render(filtered);
    }
}

// Función global para animación de redirección
window.animateAndRedirect = function(btn, url) {
    btn.classList.add('btn-clicked');
    setTimeout(() => {
        window.location.href = url;
    }, 350); // Espera 350ms para que se vea la animación
};