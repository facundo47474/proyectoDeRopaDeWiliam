/**
 * LÓGICA DE LA PÁGINA DE INICIO (Portada, Carrusel, Redes, Video y Catálogo)
 */

function iniciarCarruselPrincipal() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');
    if (slides.length === 0) return;

    let currentIndex = 0;
    const moveToSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    };

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            moveToSlide(currentIndex);
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            moveToSlide(currentIndex);
        });
    }

    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        moveToSlide(currentIndex);
    }, 5000);
}

function iniciarSeccionRedes() {
    const section = document.querySelector('.ig-section');
    if (!section) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    observer.observe(section);
}

function iniciarSeccionPortadas() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (video) {
                    video.muted = true;
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => {});
                    }
                }
            } else {
                entry.target.classList.remove('visible');
                if (video) {
                    video.pause();
                    video.currentTime = 0;
                }
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.portada-item').forEach(el => {
        const video = el.querySelector('video');
        const soundBtn = el.querySelector('.sound-toggle');

        if (video && soundBtn) {
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                const icon = soundBtn.querySelector('i');
                if (icon) {
                    icon.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
                }
            });
        }
        observer.observe(el);
    });
}

function iniciarSeccionUbicacion() {
    // Sincronizar textos con la configuración central del negocio
    if (window.NEGOCIO) {
        const elDir = document.getElementById('negocio-direccion');
        const elCiudad = document.getElementById('negocio-ciudad');
        const elHorarios = document.getElementById('negocio-horarios');
        if (elDir) elDir.textContent = window.NEGOCIO.direccion;
        if (elCiudad) elCiudad.textContent = window.NEGOCIO.ciudad;
        if (elHorarios) elHorarios.textContent = window.NEGOCIO.horarios;
    }

    const cards = document.querySelectorAll('.info-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        observer.observe(card);
    });
}

const PAGE_SIZE = 20;

const SINONIMOS_CATEGORIAS = {
    tshirt: ['remera', 'remeras', 'camiseta', 'camisetas', 'tee', 'tees', 'boxy', 'tshirt', 't-shirt', 'musculosa', 'musculosas'],
    hoodie: ['hoodie', 'hoodies', 'buzo', 'buzos', 'canguro', 'canguros', 'sweater', 'sweaters', 'campera', 'camperas', 'abrigo'],
    pants: ['pantalon', 'pantalones', 'jean', 'jeans', 'cargo', 'cargos', 'jogger', 'joggers', 'jogging', 'baggy', 'denim', 'pants', 'short', 'shorts'],
    accessories: ['accesorio', 'accesorios', 'gorra', 'gorras', 'cap', 'media', 'medias', 'rinonera', 'cinto', 'cinturon', 'bolso', 'mochila', 'billetera'],
    combos: ['combo', 'combos', 'conjunto', 'conjuntos', 'pack']
};

function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function construirMapaCategorias(categories) {
    const map = {};
    (categories || []).forEach(c => {
        if (c && c.id) map[c.id] = c.name || c.id;
    });
    return map;
}

function coincideBusqueda(product, termRaw, categoriesMap) {
    const termNorm = normalizarTexto(termRaw);
    if (!termNorm) return true;

    const words = termNorm.split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;

    const catId = normalizarTexto(product.category || '');
    const catName = normalizarTexto(categoriesMap[product.category] || product.category || '');
    const sinonimos = SINONIMOS_CATEGORIAS[catId] || [];

    const searchableParts = [
        normalizarTexto(product.name),
        normalizarTexto(product.description),
        catId,
        catName,
        ...sinonimos
    ];
    if (product.isOffer) {
        searchableParts.push('oferta', 'ofertas', 'sale', 'descuento');
    }

    const haystack = searchableParts.join(' ');

    return words.every(word => {
        if (haystack.includes(word)) return true;
        // Soportar singular/plural simple (ej. "remera" -> "remeras", "pantalon" -> "pantalones")
        if (word.endsWith('s') && word.length > 3 && haystack.includes(word.slice(0, -1))) return true;
        if (word.endsWith('es') && word.length > 4 && haystack.includes(word.slice(0, -2))) return true;
        return false;
    });
}

async function iniciarFiltrosPortada() {
    const filterBar = document.querySelector('.products-filter-bar');
    if (!filterBar) return;

    let categories = window.NEGOCIO?.categoriasBase || [];
    if (window.firebaseManager && typeof window.firebaseManager.getCategories === 'function') {
        categories = await window.firebaseManager.getCategories();
    } else {
        try {
            const localCats = JSON.parse(localStorage.getItem('urbanHustlerCategories'));
            if (Array.isArray(localCats) && localCats.length > 0) categories = localCats;
        } catch (e) {}
    }

    window._catalogCategories = categories;
    window._catalogCategoriesMap = construirMapaCategorias(categories);
    window.latestDropsFilter = window.latestDropsFilter || 'all';
    window.latestDropsSearch = window.latestDropsSearch || '';
    window.catalogVisibleLimit = window.catalogVisibleLimit || PAGE_SIZE;

    const filterOptions = [
        { id: 'all', name: 'Todos' },
        ...categories.map(c => ({ id: c.id, name: c.name || c.id })),
        { id: 'offers', name: 'Sale / Ofertas' }
    ];

    const currentOpt = filterOptions.find(o => o.id === window.latestDropsFilter) || filterOptions[0];
    window.latestDropsFilter = currentOpt.id;

    const menuItemsHTML = filterOptions.map(opt => {
        const isActive = opt.id === window.latestDropsFilter ? 'active' : '';
        return `<button type="button" class="filter-option ${isActive}" role="option" aria-selected="${opt.id === window.latestDropsFilter}" data-filter="${window.escaparHTML(opt.id)}">${window.escaparHTML(opt.name)}</button>`;
    }).join('');

    filterBar.innerHTML = `
        <div class="catalog-toolbar">
            <div class="filter-dropdown" id="catalog-filter-dropdown">
                <button type="button" class="filter-dropdown-toggle" id="filter-dropdown-btn" aria-haspopup="listbox" aria-expanded="false">
                    <span class="filter-dropdown-label">FILTRAR: <strong id="filter-current-label">${window.escaparHTML(currentOpt.name.toUpperCase())}</strong></span>
                    <i class="fa-solid fa-chevron-down filter-chevron"></i>
                </button>
                <div class="filter-dropdown-menu" id="filter-dropdown-menu" role="listbox">
                    ${menuItemsHTML}
                </div>
            </div>

            <div class="catalog-search-wrap">
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="section-search-input" placeholder="BUSCAR PRENDA O CATEGORÍA (EJ: REMERA)..." aria-label="Buscar prenda por nombre o categoría">
                    <button type="button" id="search-clear-btn" class="search-clear-btn" aria-label="Limpiar búsqueda" style="display: ${window.latestDropsSearch ? 'flex' : 'none'};">&times;</button>
                </div>
            </div>
        </div>
    `;

    const dropdown = document.getElementById('catalog-filter-dropdown');
    const toggleBtn = document.getElementById('filter-dropdown-btn');
    const currentLabel = document.getElementById('filter-current-label');
    const optionsEls = filterBar.querySelectorAll('.filter-option');

    const closeDropdown = () => {
        dropdown?.classList.remove('open');
        toggleBtn?.setAttribute('aria-expanded', 'false');
    };

    toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (!window._catalogDropdownOutsideBound) {
        window._catalogDropdownOutsideBound = true;
        document.addEventListener('click', (e) => {
            const activeDropdown = document.getElementById('catalog-filter-dropdown');
            if (activeDropdown && !activeDropdown.contains(e.target)) {
                activeDropdown.classList.remove('open');
                document.getElementById('filter-dropdown-btn')?.setAttribute('aria-expanded', 'false');
            }
        });
    }

    window.setCatalogFilter = (nuevoFiltro) => {
        const match = filterOptions.find(o => o.id === nuevoFiltro) || filterOptions[0];
        window.latestDropsFilter = match.id;
        window.catalogVisibleLimit = PAGE_SIZE;

        if (currentLabel) currentLabel.textContent = match.name.toUpperCase();
        optionsEls.forEach(optEl => {
            const active = optEl.dataset.filter === match.id;
            optEl.classList.toggle('active', active);
            optEl.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        closeDropdown();
        window.renderLatestDrops(false);
    };

    optionsEls.forEach(optEl => {
        optEl.addEventListener('click', () => {
            window.setCatalogFilter(optEl.dataset.filter);
        });
    });

    const searchInput = document.getElementById('section-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (searchInput) {
        searchInput.value = window.latestDropsSearch;
        searchInput.addEventListener('input', (e) => {
            window.latestDropsSearch = e.target.value;
            window.catalogVisibleLimit = PAGE_SIZE;
            if (clearBtn) clearBtn.style.display = e.target.value ? 'flex' : 'none';
            window.renderLatestDrops(false);
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            window.latestDropsSearch = '';
            window.catalogVisibleLimit = PAGE_SIZE;
            clearBtn.style.display = 'none';
            window.renderLatestDrops(false);
            searchInput.focus();
        });
    }
}

window.renderLatestDrops = async function (forceRefresh = false) {
    const container = document.getElementById('home-products-grid');
    const paginationContainer = document.getElementById('catalog-pagination');
    if (!container) return;

    const obtenerProductos = async () => {
        if (!forceRefresh && Array.isArray(window._catalogProductsCache) && window._catalogProductsCache.length > 0) {
            return window._catalogProductsCache;
        }

        let products = [];
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            const cloudProducts = await window.firebaseManager.getCollection('products');
            if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
                products = cloudProducts;
            }
        }
        if (products.length === 0) {
            try {
                const stored = localStorage.getItem('urbanHustlerProducts');
                if (stored) products = JSON.parse(stored) || [];
            } catch (e) {}
        }
        if (products.length > 0) {
            window._catalogProductsCache = products;
        }
        return products;
    };

    if (!window._catalogProductsCache || forceRefresh) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; grid-column: 1 / -1; gap: 16px;">
                <div class="spinner-loader" style="width: 36px; height: 36px; border: 2px solid rgba(255, 255, 255, 0.12); border-top: 2px solid #E6E6E6; border-radius: 50%; animation: spin-loader 0.8s linear infinite;"></div>
                <p style="color: #8C8C8C; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase;">Cargando colección...</p>
            </div>
            <style>@keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
        if (paginationContainer) paginationContainer.innerHTML = '';
    }

    const mostrarTarjetas = (listaProductos) => {
        let products = listaProductos.filter(p => p && p.id !== undefined && p.id !== null && p.hidden !== true);
        const currentFilter = window.latestDropsFilter || 'all';
        const categoriesMap = window._catalogCategoriesMap || {};

        if (window.latestDropsSearch && window.latestDropsSearch.trim() !== '') {
            products = products.filter(p => coincideBusqueda(p, window.latestDropsSearch, categoriesMap));
        }

        if (currentFilter === 'offers') {
            products = products.filter(p => p.isOffer === true);
        } else if (currentFilter !== 'all') {
            products = products.filter(p => p.category === currentFilter);
        }

        const totalMatching = products.length;
        if (totalMatching === 0) {
            container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #8C8C8C; padding: 60px 20px; font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase;">No se encontraron prendas con esos filtros.</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const limit = window.catalogVisibleLimit || PAGE_SIZE;
        const visibleProducts = products.slice(0, limit);

        container.innerHTML = visibleProducts.map((product, index) => {
            const href = window.obtenerUrlProducto(product);
            const optimizedImg = window.optimizeCloudinary(product.image, 650);
            const rawSecondary = Array.isArray(product.images) && product.images.length > 1 ? product.images[1] : null;
            const secondaryImg = rawSecondary ? window.optimizeCloudinary(rawSecondary, 650) : null;
            const loadingAttr = index < 4 ? 'eager' : 'lazy';
            const priorityAttr = index < 4 ? 'fetchpriority="high"' : '';
            const nombreSeguro = window.escaparHTML(product.name || 'Producto');
            const catLabel = categoriesMap[product.category] || product.category || 'STREETWEAR';
            const catSegura = window.escaparHTML(String(catLabel).toUpperCase());
            const sizesList = Array.isArray(product.sizes) && product.sizes.length > 0
                ? product.sizes.map(s => window.escaparHTML(s)).join(' · ')
                : 'S · M · L · XL';
            const sinStock = product.stock !== undefined && Number(product.stock) <= 0;

            return `
            <article class="product-card ${secondaryImg ? 'has-secondary' : ''}" onclick="window.location.href='${href}'">
                <div class="card-image">
                    <div class="card-badges">
                        ${product.isOffer ? '<span class="card-badge badge-sale">SALE</span>' : ''}
                        ${sinStock ? '<span class="card-badge badge-soldout">AGOTADO</span>' : ''}
                    </div>
                    <img class="card-img-primary" src="${window.escaparHTML(optimizedImg)}" alt="${nombreSeguro}"
                         width="600" height="800"
                         loading="${loadingAttr}" ${priorityAttr} decoding="async">
                    ${secondaryImg ? `<img class="card-img-secondary" src="${window.escaparHTML(secondaryImg)}" alt="${nombreSeguro} vista alternativa" width="600" height="800" loading="lazy" decoding="async">` : ''}
                    <div class="card-actions">
                        <span class="card-sizes-preview">${sizesList}</span>
                        <button type="button" class="btn-shop" onclick="event.stopPropagation(); window.location.href='${href}'">VER PRENDA</button>
                    </div>
                </div>
                <div class="card-details">
                    <span class="card-category">${catSegura}</span>
                    <h3 class="card-title">${nombreSeguro}</h3>
                    <div class="card-price-block">
                        <span class="price">${window.formatearPrecio(product.price)}</span>
                        <span class="price-sub">PRECIO ONLINE</span>
                    </div>
                </div>
            </article>`;
        }).join('');

        if (paginationContainer) {
            const remaining = totalMatching - visibleProducts.length;
            const nextBatch = Math.min(PAGE_SIZE, remaining);
            paginationContainer.innerHTML = `
                <span class="pagination-count">MOSTRANDO ${visibleProducts.length} DE ${totalMatching} PRENDAS</span>
                ${remaining > 0 ? `<button type="button" class="btn-load-more" id="btn-load-more-products">VER ${nextBatch} MÁS</button>` : ''}
            `;

            document.getElementById('btn-load-more-products')?.addEventListener('click', () => {
                window.catalogVisibleLimit = (window.catalogVisibleLimit || PAGE_SIZE) + PAGE_SIZE;
                mostrarTarjetas(listaProductos);
            });
        }
    };

    const initialProducts = await obtenerProductos();
    if (initialProducts.length > 0) {
        mostrarTarjetas(initialProducts);
    } else if (window.firebaseManager && !window.firebaseManager.isInitialized) {
        return;
    } else {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999; padding: 40px;">Aún no hay productos cargados en el catálogo.</p>';
        if (paginationContainer) paginationContainer.innerHTML = '';
    }
};

async function verificarRetornoMercadoPago(params) {
    const pago = params.get('pago');
    const mpStatus = (params.get('status') || params.get('collection_status') || '').toLowerCase();
    const orden = params.get('orden') || params.get('external_reference') || '';
    const paymentId = params.get('payment_id') || params.get('collection_id') || '';

    if (!pago && !mpStatus) return;

    // Limpiar parámetros de la URL inmediatamente para no re-disparar al recargar
    window.history.replaceState({}, document.title, window.location.pathname);

    let state = pago;
    if (!state) {
        if (mpStatus === 'approved') state = 'exitoso';
        else if (mpStatus === 'in_process' || mpStatus === 'pending') state = 'pendiente';
        else if (mpStatus) state = 'fallido';
    }
    if (mpStatus === 'approved' && state !== 'exitoso') state = 'exitoso';

    // Sincronizar con backend por si el webhook aún está en tránsito
    let serverSummary = null;
    if (orden) {
        try {
            const url = `/api/estado-pago?orderId=${encodeURIComponent(orden)}&paymentId=${encodeURIComponent(paymentId)}`;
            const resp = await fetch(url);
            if (resp.ok) {
                const json = await resp.json();
                if (json && json.ok) serverSummary = json;
            }
        } catch (e) {}
    }

    if (state === 'exitoso' || state === 'pendiente') {
        try {
            localStorage.removeItem('urbanHustlerCart');
        } catch (e) {}
        if (window.cartManager && typeof window.cartManager.clearCart === 'function') {
            window.cartManager.clearCart();
        }
    }

    const existing = document.getElementById('payment-result-overlay');
    if (existing) existing.remove();

    const ordenEsc = window.escaparHTML(orden || serverSummary?.orderId || '-');
    const opEsc = window.escaparHTML(paymentId || serverSummary?.mpPaymentId || '-');
    const totalFmt = serverSummary?.total ? window.formatearPrecio(serverSummary.total) : '';
    const envioLabel = serverSummary?.deliveryType === 'pickup'
        ? 'Retiro en Local (San Lorenzo 19, Apóstoles)'
        : (serverSummary?.zoneLabel || 'Envío a Domicilio');

    let iconClass = 'success';
    let iconName = 'fa-check';
    let title = '¡COMPRA CONFIRMADA!';
    let bodyMsg = 'Recibimos tu pago correctamente. Ya estamos preparando tu pedido y te enviaremos el seguimiento por WhatsApp o Email.';

    if (state === 'pendiente') {
        iconClass = 'pending';
        iconName = 'fa-clock';
        title = 'PAGO EN REVISIÓN';
        bodyMsg = 'Tu pago está siendo procesado por Mercado Pago (ej. Rapipago, Pago Fácil o verificación de tarjeta). Apenas se acredite confirmaremos el despacho.';
    } else if (state === 'fallido') {
        iconClass = 'failure';
        iconName = 'fa-xmark';
        title = 'EL PAGO NO SE COMPLETÓ';
        bodyMsg = 'No pudimos procesar tu pago. Tus prendas siguen guardadas en el carrito para que reintentes con otro medio de pago o coordines por WhatsApp.';
    }

    const phone = window.NEGOCIO?.whatsapp || '5493758555948';
    const waText = state === 'fallido'
        ? `¡Hola UrbanHustler! Tuve un problema al pagar el pedido #${orden || ''} con Mercado Pago y quiero coordinar otra forma de pago.`
        : `¡Hola UrbanHustler! Realicé el pedido #${orden || ''} por Mercado Pago${paymentId ? ` (Operación: ${paymentId})` : ''}. ¡Quedo atento al envío!`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waText)}`;

    const overlay = document.createElement('div');
    overlay.id = 'payment-result-overlay';
    overlay.className = 'payment-result-overlay';
    overlay.innerHTML = `
        <div class="payment-result-modal" role="dialog" aria-modal="true">
            <div class="payment-result-icon ${iconClass}">
                <i class="fa-solid ${iconName}"></i>
            </div>
            <h2>${title}</h2>
            <p>${bodyMsg}</p>
            ${(orden || opEsc !== '-' || totalFmt) ? `
                <div class="payment-result-meta">
                    <div><span>N° de Orden</span><strong>#${ordenEsc}</strong></div>
                    ${opEsc !== '-' ? `<div><span>Operación MP</span><strong>#${opEsc}</strong></div>` : ''}
                    ${serverSummary ? `<div><span>Entrega</span><strong>${window.escaparHTML(envioLabel)}</strong></div>` : ''}
                    ${totalFmt ? `<div><span>Total</span><strong>${totalFmt}</strong></div>` : ''}
                </div>
            ` : ''}
            <div class="payment-result-actions">
                ${state === 'fallido'
                    ? `<button type="button" class="btn-mercadopago" id="btn-retry-checkout"><i class="fa-solid fa-rotate-right"></i> REINTENTAR EN EL CARRITO</button>`
                    : `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-mercadopago" style="text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> AVISAR / SEGUIR POR WHATSAPP</a>`
                }
                <button type="button" class="btn-checkout-whatsapp" id="btn-close-payment-modal">SEGUIR VIENDO LA TIENDA</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btn-close-payment-modal')?.addEventListener('click', () => overlay.remove());
    document.getElementById('btn-retry-checkout')?.addEventListener('click', () => {
        overlay.remove();
        window.cartManager?.openCheckoutStep?.();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.body.classList.contains('home-page')) return;

    const params = new URLSearchParams(window.location.search);
    if (params.has('category')) window.latestDropsFilter = params.get('category');
    if (params.has('filter') && params.get('filter') === 'offers') window.latestDropsFilter = 'offers';

    verificarRetornoMercadoPago(params);

    if (document.getElementById('carousel-container')) {
        await window.CargadorComponentes.loadComponent('carousel-container', '/componentes/carrusel.html');
        iniciarCarruselPrincipal();
    }

    if (document.getElementById('social-media-container')) {
        await window.CargadorComponentes.loadComponent('social-media-container', '/componentes/redes.html');
        iniciarSeccionRedes();
    }

    if (document.getElementById('portadas-container')) {
        await window.CargadorComponentes.loadComponent('portadas-container', '/componentes/portadas.html');
        iniciarSeccionPortadas();
    }

    if (document.getElementById('productos-container')) {
        await iniciarFiltrosPortada();
        await window.renderLatestDrops(true);

        document.addEventListener('firebase-ready', async () => {
            await iniciarFiltrosPortada();
            await window.renderLatestDrops(true);
        });
    }

    if (document.getElementById('ubicacion-container')) {
        await window.CargadorComponentes.loadComponent('ubicacion-container', '/componentes/ubicacion.html');
        iniciarSeccionUbicacion();
    }

    if (typeof window.iniciarAnimacionesScroll === 'function') {
        window.iniciarAnimacionesScroll();
    }
});

