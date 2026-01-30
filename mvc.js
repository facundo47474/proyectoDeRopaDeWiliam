/**
 * SERVICE: Capa de Servicios (Data Fetching)
 * Simula una API REST.
 */
class ProductService {
    async fetchProducts() {
        return new Promise(resolve => {
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
            searchTerm: ''
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
            return catMatch && genderMatch && priceMatch && searchMatch;
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
            this.grid.innerHTML = '<div class="no-results">No se encontraron productos con esos filtros.</div>';
            return;
        }

        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="card-actions">
                        <button class="btn-shop" onclick="window.location.href='detailProduct.html?id=${product.id}'">Comprar Ahora</button>
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
            this.grid.appendChild(card);

            // Inyectar sección intermedia después de la 6ta tarjeta (índice 5)
            if (index === 5) {
                const breakSection = document.createElement('div');
                breakSection.className = 'catalog-break-section';
                breakSection.innerHTML = `
                    <div class="catalog-break-content">
                        <div class="break-video">
                            <video autoplay muted loop playsinline>
                                <source src="catalogo1.mp4" type="video/mp4">
                            </video>
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

                this.grid.appendChild(breakSection);
            }
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