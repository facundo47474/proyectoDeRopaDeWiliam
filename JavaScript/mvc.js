/**
 * SERVICE: Capa de Servicios (Data Fetching)
 * Simula una API REST.
 */
class ProductService {
    async fetchProducts() {
        return new Promise(resolve => {
            // 0. Intentar cargar desde Firebase (Nube) - Prioridad 1
            if (window.firebaseManager && window.firebaseManager.isInitialized) {
                window.firebaseManager.getCollection('products').then(products => {
                    if (products && products.length > 0) resolve(this.mapStock(products));
                    else this.fetchLocal(resolve);
                });
                return;
            }
            this.fetchLocal(resolve);
        });
    }

    mapStock(products) {
        return products.map(p => ({ ...p, stock: (p.stock !== undefined) ? parseInt(p.stock) : 5 }));
    }

    fetchLocal(resolve) {
            // 1. Intentar cargar desde LocalStorage (Datos editados por Admin)
            const storedProducts = localStorage.getItem('urbanHustlerProducts');
            if (storedProducts) {
                resolve(this.mapStock(JSON.parse(storedProducts)));
                return;
            }

            // Verificamos que MOCK_DB exista para evitar errores
            if (typeof MOCK_DB === 'undefined') {
                console.error("Error: MOCK_DB no está definido. Asegúrate de cargar data.js");
                resolve([]);
                return;
            }
            setTimeout(() => resolve(this.mapStock([...MOCK_DB])), 300);
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

    render(products, categoryFilter = 'all') {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        // Validar que todos los productos tengan ID válido
        const validProducts = products.filter(p => {
            if (!p.id || (typeof p.id !== 'number' && typeof p.id !== 'string')) {
                console.warn("⚠️ Producto sin ID válido en catálogo:", p.name, p);
                return false;
            }
            return true;
        });

        if (validProducts.length === 0) {
            this.grid.innerHTML = '<div class="no-results" style="opacity:0; animation: fadeIn 0.5s forwards;">No se encontraron productos con esos filtros.</div>';
            return;
        }

        console.log("✅ Renderizando", validProducts.length, "productos en catálogo:", validProducts.map(p => ({ id: p.id, name: p.name })));

        let breakRendered = false;

        validProducts.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // Animación en cascada dinámica (Staggered)
            // Limitamos el delay máximo a 800ms para no hacer esperar demasiado al usuario
            const delay = Math.min(index * 100, 800);
            card.style.animationDelay = `${delay}ms`;
            
            const optimizedImg = window.optimizeCloudinary(product.image, 400);

            const safeId = String(product.id); // Asegurar que el ID sea string para la URL

            card.innerHTML = `
                <div class="card-image" style="aspect-ratio: 1/1; background: #222; overflow: hidden;">
                    <img src="${optimizedImg}" alt="${product.name}" 
                         width="350" height="350" 
                         loading="lazy" decoding="async">
                    <div class="card-actions">
                        <button class="btn-shop" onclick="animateAndRedirect(this, 'detailProduct.html?id=${safeId}')">Comprar Ahora</button>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-header">
                        <h3>${product.name}</h3>
                        <span class="price">${window.formatPrice(product.price)}</span>
                    </div>
                    <p class="card-desc">Estilo urbano de alta calidad. Edición limitada.</p>
                    <div class="tags">
                        <span>${product.category.toUpperCase()}</span>
                        ${product.isOffer ? '<span style="background: #D90429; color: #fff; border: none;">OFERTA</span>' : ''}
                        ${product.stock <= 0 ? '<span style="background: #555; color: #fff; border: none;">AGOTADO</span>' : ''}
                    </div>
                </div>
            `;

            this.grid.appendChild(card);

            // Inyectar sección intermedia después de la 4ta tarjeta (índice 3)
            if (index === 3 && categoryFilter === 'all') {
                this.appendBreakSection(index);
                breakRendered = true;
            }
        });

        // Fallback: Si es "Ver Todo" y no se renderizó (porque hay menos de 4 productos), mostrar al final
        if (categoryFilter === 'all' && !breakRendered) {
            this.appendBreakSection(validProducts.length);
        }
    }

    appendBreakSection(index) {
        const breakSection = document.createElement('div');
        breakSection.className = 'catalog-break-section';
        breakSection.style.animationDelay = `${(index + 1) * 100}ms`; // Delay secuencial
        breakSection.innerHTML = `
            <span></span><span></span><span></span><span></span>
            <div class="catalog-break-content" style="display: flex; flex-direction: column; gap: 0; align-items: stretch;">
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
                    <div class="break-video-carousel" id="catalogCarousel-${index}" style="flex: 1; display: flex; justify-content: center; align-items: center;">
                        <div class="mobile-device-carousel-catalog">
                            <div class="mobile-device">
                                <div class="mobile-device-screen">
                                    <div class="mobile-slider">
                                        <div class="mobile-slide active" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (1).jpeg" alt="Look 1">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (2).jpeg" alt="Look 2">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (3).jpeg" alt="Look 3">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (4).jpeg" alt="Look 4">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (5).jpeg" alt="Look 5">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (6).jpeg" alt="Look 6">
                                        </div>
                                        <div class="mobile-slide" style="--zoom: 1.42; --x: 50%; --y: 50%;">
                                            <img src="../img/img 1 (7).jpeg" alt="Look 7">
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
                            <input type="text" placeholder="Tu nombre" required style="padding: 12px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px; outline: none;">
                            <textarea placeholder="Comparte tu opinión..." required style="padding: 12px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px; min-height: 100px; outline: none; resize: vertical;"></textarea>
                            <button type="submit" style="padding: 12px; background: #2ecc71; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.3s; text-transform: uppercase;">Enviar Comentario</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Inicializar carrusel de fotos
        const carouselId = breakSection.querySelector('[id^="catalogCarousel-"]').id;
        initMobileCarousel(carouselId);

        // Agregar funcionalidad del formulario
        const form = breakSection.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = form.querySelector('input');
            const textInput = form.querySelector('textarea');
            
            if (!nameInput.value.trim() || !textInput.value.trim()) return;

            const newComment = {
                id: Date.now(),
                name: nameInput.value.trim(),
                text: textInput.value.trim(),
                date: new Date().toISOString()
            };

            // Guardar Localmente
            const comments = JSON.parse(localStorage.getItem('urbanHustlerComments')) || [];
            comments.push(newComment);
            localStorage.setItem('urbanHustlerComments', JSON.stringify(comments));

            // Guardar en Nube
            if (window.firebaseManager) {
                window.firebaseManager.saveComment(newComment);
            }

            alert('¡Gracias por compartir tu experiencia con UrbanHustler!');
            form.reset();
        });

        this.grid.appendChild(breakSection);
    }

    // Sin tilt/zoom para reducir repaints y mantener interacción más liviana.
    attachTiltEffect() {}
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
        if (params.has('category')) {
            this.model.updateFilter('category', params.get('category'));
        }
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
        this.view.render(filtered, this.model.filters.category);
    }
}

// Redirección directa sin animación de pulsación.
window.animateAndRedirect = function(_btn, url) {
    window.location.href = url;
};
