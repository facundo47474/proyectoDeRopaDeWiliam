/**
 * CARRITO DE COMPRAS Y CHECKOUT EN 2 PASOS (Mercado Pago + Envíos + WhatsApp)
 * - Paso 1: Revisión de prendas + Barra dinámica de Envío Gratis
 * - Paso 2: Datos de comprador y envío/retiro + Cotización por zona/CP
 * - Pago principal: Mercado Pago Checkout Pro (/api/crear-preferencia)
 * - Pago alternativo: WhatsApp / Transferencia con envío de datos completos
 */
class CartManager {
    constructor() {
        try {
            this.cart = JSON.parse(localStorage.getItem('urbanHustlerCart')) || [];
            if (!Array.isArray(this.cart)) this.cart = [];
        } catch (e) {
            this.cart = [];
        }

        this.checkoutStep = 'cart'; // 'cart' | 'shipping'
        this.isSubmittingMP = false;
        this.shippingConfig = this.loadCachedShippingConfig();
        this.draft = this.loadShippingDraft();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    loadCachedShippingConfig() {
        try {
            const raw = JSON.parse(localStorage.getItem('urbanHustlerShippingConfig'));
            if (typeof window.normalizarShippingConfig === 'function') {
                return window.normalizarShippingConfig(raw);
            }
        } catch (e) {}
        return typeof window.normalizarShippingConfig === 'function'
            ? window.normalizarShippingConfig(null)
            : {
                freeShippingEnabled: true,
                freeShippingThreshold: 120000,
                localPostalCode: '3350',
                rates: { local: 2500, zone1_nea_close: 6500, zone2_litoral: 8500, zone3_national: 10500, zone4_patagonia: 14500 }
            };
    }

    async refreshShippingConfig() {
        if (window.firebaseManager && typeof window.firebaseManager.getShippingConfig === 'function') {
            this.shippingConfig = await window.firebaseManager.getShippingConfig();
            this.updateShippingBannerAndTotals();
        }
    }

    loadShippingDraft() {
        const userInfo = typeof window.obtenerUsuarioActual === 'function' ? (window.obtenerUsuarioActual() || {}) : {};
        let saved = {};
        try {
            saved = JSON.parse(localStorage.getItem('urbanHustlerShippingDraft')) || {};
        } catch (e) {
            saved = {};
        }

        return {
            deliveryType: saved.deliveryType === 'pickup' ? 'pickup' : 'home_delivery',
            fullName: saved.fullName || userInfo.name || '',
            dni: saved.dni || '',
            phone: saved.phone || '',
            email: saved.email || userInfo.email || '',
            province: saved.province || '',
            postalCode: saved.postalCode || '',
            city: saved.city || '',
            streetName: saved.streetName || '',
            streetNumber: saved.streetNumber || '',
            apartment: saved.apartment || '',
            reference: saved.reference || ''
        };
    }

    saveShippingDraft() {
        try {
            localStorage.setItem('urbanHustlerShippingDraft', JSON.stringify(this.draft));
        } catch (e) {}
    }

    setup() {
        if (!document.querySelector('.cart-drawer')) {
            this.injectCartHTML();
        }

        this.cartDrawer = document.querySelector('.cart-drawer');
        this.cartOverlay = document.querySelector('.cart-overlay');
        this.cartCountElements = document.querySelectorAll('.cart-count-badge');

        document.addEventListener('click', (e) => {
            const target = e.target;
            const isExplicitTrigger = target.closest('.cart-trigger') || target.closest('#cart-btn') || target.closest('.nav-cart-btn');
            const isCartIcon = target.closest('.fa-cart-shopping') || target.closest('.fa-shopping-cart') || target.closest('.fa-bag-shopping');
            const isNavbarContext = target.closest('.nav-icons') || target.closest('.navbar');

            if (isExplicitTrigger || (isCartIcon && isNavbarContext)) {
                e.preventDefault();
                this.openCart();
            }
        });

        this.cartOverlay?.addEventListener('click', () => this.closeCart());

        this.renderCart();
        this.refreshShippingConfig();

        document.addEventListener('firebase-ready', () => this.refreshShippingConfig());
        document.addEventListener('app:navbar-loaded', () => {
            this.cartCountElements = document.querySelectorAll('.cart-count-badge');
            this.updateCartCount();
        });
    }

    injectCartHTML() {
        const cartHTML = `
            <div class="cart-overlay"></div>
            <div class="checkout-overlay">
                <div class="checkout-content">
                    <div class="checkout-logo">
                        <img src="/recursos/imagenes/logo.jpeg" alt="UrbanHustler">
                    </div>
                    <h2 class="checkout-text">Preparando Pedido...</h2>
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
            </div>
            <div class="cart-drawer" role="dialog" aria-label="Carrito de compras">
                <div class="cart-header">
                    <div class="cart-header-left">
                        <button type="button" class="btn-back-cart" id="btn-cart-back" style="display:none;" aria-label="Volver al carrito">
                            <i class="fa-solid fa-arrow-left"></i>
                        </button>
                        <h3 id="cart-drawer-title">Tu Carrito</h3>
                    </div>
                    <button type="button" class="close-cart" aria-label="Cerrar carrito"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="free-shipping-strip" id="free-shipping-strip" style="display:none;"></div>
                <div class="cart-items-container" id="cart-body-container"></div>
                <div class="cart-footer" id="cart-footer-container"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);

        document.querySelector('.close-cart')?.addEventListener('click', () => this.closeCart());
        document.getElementById('btn-cart-back')?.addEventListener('click', () => {
            this.checkoutStep = 'cart';
            this.renderCart();
        });
    }

    openCart() {
        this.cartDrawer?.classList.add('open');
        this.cartOverlay?.classList.add('active');
    }

    openCheckoutStep() {
        if (this.cart.length > 0) {
            this.checkoutStep = 'shipping';
            this.renderCart();
        }
        this.openCart();
    }

    closeCart() {
        this.cartDrawer?.classList.remove('open');
        this.cartOverlay?.classList.remove('active');
    }

    clearCart() {
        this.cart = [];
        this.checkoutStep = 'cart';
        this.saveCart();
        this.renderCart();
    }

    addItem(product, quantity = 1, size = 'M') {
        if (!product) return;

        const maxStock = product.stock !== undefined ? parseInt(product.stock, 10) : 5;
        if (maxStock <= 0) {
            this.showNotification('Este producto está agotado');
            return;
        }

        const existingIndex = this.cart.findIndex(item => String(item.id) === String(product.id) && item.size === size);
        if (existingIndex > -1) {
            const nuevaCantidad = this.cart[existingIndex].quantity + quantity;
            if (nuevaCantidad > maxStock) {
                this.cart[existingIndex].quantity = maxStock;
                this.showNotification(`Stock máximo disponible alcanzado (${maxStock} u.)`);
            } else {
                this.cart[existingIndex].quantity = nuevaCantidad;
                this.showNotification(`Agregado: ${product.name}`);
            }
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                image: product.image,
                category: product.category || 'Varios',
                size: size || 'U',
                maxStock: maxStock,
                quantity: Math.min(quantity, maxStock)
            });
            this.showNotification(`Agregado: ${product.name}`);
        }

        this.checkoutStep = 'cart';
        this.saveCart();
        this.renderCart();
        this.openCart();
    }

    removeItem(index) {
        this.cart.splice(index, 1);
        if (this.cart.length === 0) {
            this.checkoutStep = 'cart';
        }
        this.saveCart();
        this.renderCart();
    }

    updateQuantity(index, change) {
        const item = this.cart[index];
        if (!item) return;

        const limiteStock = item.maxStock !== undefined ? parseInt(item.maxStock, 10) : 10;
        const newQty = item.quantity + change;

        if (newQty > limiteStock) {
            this.showNotification(`Solo hay ${limiteStock} unidades en stock`);
            return;
        }

        if (newQty >= 1) {
            item.quantity = newQty;
            this.saveCart();
            this.renderCart();
        }
    }

    calculateTotal() {
        return this.cart.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
    }

    getShippingQuote() {
        const subtotal = this.calculateTotal();
        if (typeof window.calcularCostoEnvio === 'function') {
            return window.calcularCostoEnvio(this.draft, subtotal, this.cart, this.shippingConfig);
        }
        return { ready: true, deliveryType: 'pickup', cost: 0, isFree: true, zoneLabel: 'A coordinar', eta: '' };
    }

    saveCart() {
        try {
            localStorage.setItem('urbanHustlerCart', JSON.stringify(this.cart));
        } catch (e) {}
        this.updateCartCount();
    }

    updateCartCount() {
        const count = this.cart.reduce((acc, item) => acc + Number(item.quantity), 0);
        this.cartCountElements = document.querySelectorAll('.cart-count-badge');
        this.cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    renderFreeShippingStrip() {
        const strip = document.getElementById('free-shipping-strip');
        if (!strip) return;

        const cfg = this.shippingConfig;
        if (this.cart.length === 0 || !cfg || cfg.freeShippingEnabled === false) {
            strip.style.display = 'none';
            return;
        }

        const subtotal = this.calculateTotal();
        const threshold = Number(cfg.freeShippingThreshold || 120000);
        const faltante = Math.max(0, threshold - subtotal);
        const pct = Math.min(100, Math.round((subtotal / Math.max(1, threshold)) * 100));

        strip.style.display = 'block';
        if (faltante === 0) {
            strip.innerHTML = `
                <div class="free-shipping-msg unlocked">
                    <i class="fa-solid fa-truck-fast"></i>
                    <span>¡Tenés <strong>ENVÍO GRATIS</strong> bonificado en este pedido!</span>
                </div>
                <div class="free-shipping-bar"><span style="width: 100%; background: #2ecc71;"></span></div>
            `;
        } else {
            strip.innerHTML = `
                <div class="free-shipping-msg">
                    <i class="fa-solid fa-truck"></i>
                    <span>Agregá <strong>${window.formatearPrecio(faltante)}</strong> más para tener <strong>ENVÍO GRATIS</strong></span>
                </div>
                <div class="free-shipping-bar"><span style="width: ${pct}%;"></span></div>
            `;
        }
    }

    renderCart() {
        const bodyContainer = document.getElementById('cart-body-container');
        const footerContainer = document.getElementById('cart-footer-container');
        const titleEl = document.getElementById('cart-drawer-title');
        const backBtn = document.getElementById('btn-cart-back');
        if (!bodyContainer || !footerContainer) return;

        this.updateCartCount();
        this.renderFreeShippingStrip();

        if (this.cart.length === 0) {
            this.checkoutStep = 'cart';
            if (titleEl) titleEl.textContent = 'Tu Carrito';
            if (backBtn) backBtn.style.display = 'none';

            bodyContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; margin-bottom: 1rem; color: #555;"></i>
                    <p>Tu carrito está vacío.</p>
                </div>
            `;
            footerContainer.innerHTML = `
                <div class="cart-total">
                    <span>Total</span>
                    <span>$0</span>
                </div>
                <button type="button" class="btn-checkout" disabled style="opacity:0.45; cursor:not-allowed;">Tu carrito está vacío</button>
            `;
            return;
        }

        if (this.checkoutStep === 'shipping') {
            if (titleEl) titleEl.textContent = 'Datos y Envío';
            if (backBtn) backBtn.style.display = 'inline-flex';
            this.renderShippingStep(bodyContainer, footerContainer);
            return;
        }

        // Paso 1: Lista de prendas
        const totalUnits = this.cart.reduce((acc, i) => acc + Number(i.quantity || 1), 0);
        if (titleEl) titleEl.textContent = `Tu Carrito (${totalUnits})`;
        if (backBtn) backBtn.style.display = 'none';

        bodyContainer.innerHTML = '';
        this.cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            const optimizedImg = window.optimizeCloudinary(item.image, 150);
            const nombreSeguro = window.escaparHTML(item.name);
            const talleSeguro = window.escaparHTML(item.size);

            cartItem.innerHTML = `
                <img src="${window.escaparHTML(optimizedImg)}" alt="${nombreSeguro}" width="90" height="110" loading="lazy">
                <div class="cart-item-details">
                    <h4>${nombreSeguro}</h4>
                    <div class="cart-item-meta">Talle: ${talleSeguro} · ${window.formatearPrecio(item.price)}</div>
                    <div class="cart-item-controls">
                        <button type="button" class="btn-qty" onclick="window.cartManager.updateQuantity(${index}, -1)" aria-label="Disminuir cantidad">-</button>
                        <span>${Number(item.quantity)}</span>
                        <button type="button" class="btn-qty" onclick="window.cartManager.updateQuantity(${index}, 1)" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <button type="button" class="btn-remove" onclick="window.cartManager.removeItem(${index})" aria-label="Eliminar producto">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            bodyContainer.appendChild(cartItem);
        });

        const subtotal = this.calculateTotal();
        footerContainer.innerHTML = `
            <div class="cart-total">
                <span>Subtotal</span>
                <span>${window.formatearPrecio(subtotal)}</span>
            </div>
            <button type="button" class="btn-checkout" id="btn-go-shipping">
                CONTINUAR COMPRA <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;

        document.getElementById('btn-go-shipping')?.addEventListener('click', () => {
            this.checkoutStep = 'shipping';
            this.renderCart();
        });
    }

    renderShippingStep(bodyContainer, footerContainer) {
        // Autocompletar si inició sesión con Google y los campos siguen vacíos
        const userInfo = typeof window.obtenerUsuarioActual === 'function' ? (window.obtenerUsuarioActual() || {}) : {};
        if (!this.draft.fullName && userInfo.name) this.draft.fullName = userInfo.name;
        if (!this.draft.email && userInfo.email) this.draft.email = userInfo.email;

        const isPickup = this.draft.deliveryType === 'pickup';
        const provinces = window.PROVINCIAS_ARGENTINA || ['Misiones', 'Corrientes', 'Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe'];
        const provinceOptions = provinces.map(p => {
            const selected = this.draft.province === p ? 'selected' : '';
            return `<option value="${window.escaparHTML(p)}" ${selected}>${window.escaparHTML(p)}</option>`;
        }).join('');

        const storeDir = window.NEGOCIO?.direccion || 'San Lorenzo 19';
        const storeCiudad = window.NEGOCIO?.ciudad || 'Apóstoles, Misiones';
        const storeHorarios = window.NEGOCIO?.horarios || '08:00 a 11:30 hs y 15:30 a 19:30 hs';

        bodyContainer.innerHTML = `
            <div class="checkout-form-wrap">
                <div class="checkout-section-label">1. MÉTODO DE ENTREGA</div>
                <div class="delivery-mode-grid">
                    <label class="delivery-mode-card ${!isPickup ? 'active' : ''}">
                        <input type="radio" name="deliveryType" value="home_delivery" ${!isPickup ? 'checked' : ''}>
                        <div class="delivery-mode-title"><i class="fa-solid fa-truck-fast"></i> Envío a Domicilio</div>
                        <small>Correo Argentino / Despacho a todo el país</small>
                    </label>
                    <label class="delivery-mode-card ${isPickup ? 'active' : ''}">
                        <input type="radio" name="deliveryType" value="pickup" ${isPickup ? 'checked' : ''}>
                        <div class="delivery-mode-title"><i class="fa-solid fa-store"></i> Retiro en Local</div>
                        <small><strong>GRATIS</strong> · ${window.escaparHTML(storeDir)}, Apóstoles</small>
                    </label>
                </div>

                <div class="checkout-section-label">2. DATOS DE QUIEN RECIBE O RETIRA</div>
                <div class="checkout-field">
                    <label for="chk-fullName">Nombre y Apellido *</label>
                    <input type="text" id="chk-fullName" value="${window.escaparHTML(this.draft.fullName)}" placeholder="Ej: Juan Pérez" autocomplete="name">
                </div>
                <div class="checkout-field-row">
                    <div class="checkout-field">
                        <label for="chk-dni">DNI / CUIL *</label>
                        <input type="text" id="chk-dni" inputmode="numeric" maxlength="11" value="${window.escaparHTML(this.draft.dni)}" placeholder="Sin puntos">
                    </div>
                    <div class="checkout-field">
                        <label for="chk-phone">WhatsApp *</label>
                        <input type="tel" id="chk-phone" inputmode="tel" maxlength="16" value="${window.escaparHTML(this.draft.phone)}" placeholder="3758123456" autocomplete="tel">
                    </div>
                </div>
                <div class="checkout-field">
                    <label for="chk-email">Email (para comprobante y seguimiento) *</label>
                    <input type="email" id="chk-email" value="${window.escaparHTML(this.draft.email)}" placeholder="tuemail@gmail.com" autocomplete="email">
                </div>

                <div id="home-delivery-fields" style="display: ${isPickup ? 'none' : 'block'};">
                    <div class="checkout-section-label">3. DIRECCIÓN DE ENVÍO</div>
                    <div class="checkout-field-row">
                        <div class="checkout-field">
                            <label for="chk-province">Provincia *</label>
                            <select id="chk-province">
                                <option value="">Seleccionar...</option>
                                ${provinceOptions}
                            </select>
                        </div>
                        <div class="checkout-field">
                            <label for="chk-postalCode">Código Postal *</label>
                            <input type="text" id="chk-postalCode" inputmode="numeric" maxlength="8" value="${window.escaparHTML(this.draft.postalCode)}" placeholder="Ej: 3350" autocomplete="postal-code">
                        </div>
                    </div>
                    <div class="checkout-field">
                        <label for="chk-city">Ciudad / Localidad *</label>
                        <input type="text" id="chk-city" value="${window.escaparHTML(this.draft.city)}" placeholder="Ej: Posadas" autocomplete="address-level2">
                    </div>
                    <div class="checkout-field-row checkout-row-street">
                        <div class="checkout-field">
                            <label for="chk-streetName">Calle *</label>
                            <input type="text" id="chk-streetName" value="${window.escaparHTML(this.draft.streetName)}" placeholder="Ej: Av. Mitre">
                        </div>
                        <div class="checkout-field">
                            <label for="chk-streetNumber">Altura *</label>
                            <input type="text" id="chk-streetNumber" value="${window.escaparHTML(this.draft.streetNumber)}" placeholder="1450">
                        </div>
                    </div>
                    <div class="checkout-field-row">
                        <div class="checkout-field">
                            <label for="chk-apartment">Piso / Depto / Barrio</label>
                            <input type="text" id="chk-apartment" value="${window.escaparHTML(this.draft.apartment)}" placeholder="Opcional">
                        </div>
                        <div class="checkout-field">
                            <label for="chk-reference">Referencias</label>
                            <input type="text" id="chk-reference" value="${window.escaparHTML(this.draft.reference)}" placeholder="Entre calles, timbre...">
                        </div>
                    </div>
                </div>

                <div id="pickup-info-card" class="pickup-info-card" style="display: ${isPickup ? 'block' : 'none'};">
                    <div><i class="fa-solid fa-location-dot"></i> <strong>${window.escaparHTML(storeDir)}</strong>, ${window.escaparHTML(storeCiudad)}</div>
                    <small>Horarios: ${window.escaparHTML(storeHorarios)}. Presentar DNI al retirar.</small>
                </div>

                <div id="shipping-quote-box" class="shipping-quote-box"></div>
                <div id="checkout-form-error" class="checkout-form-error" style="display:none;"></div>
            </div>
        `;

        footerContainer.innerHTML = `
            <div class="checkout-totals-breakdown">
                <div class="breakdown-row">
                    <span>Subtotal prendas</span>
                    <span id="checkout-subtotal-val">${window.formatearPrecio(this.calculateTotal())}</span>
                </div>
                <div class="breakdown-row">
                    <span id="checkout-shipping-label">Envío</span>
                    <span id="checkout-shipping-summary">-</span>
                </div>
                <div class="breakdown-row total">
                    <span>TOTAL FINAL</span>
                    <strong id="checkout-grand-total">$0</strong>
                </div>
            </div>
            <div class="checkout-actions-stack">
                <button type="button" class="btn-mercadopago" id="btn-pay-mercadopago">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>PAGAR CON MERCADO PAGO</span>
                </button>
            </div>
        `;

        this.bindShippingFormEvents(bodyContainer);
        this.updateShippingBannerAndTotals();
    }

    bindShippingFormEvents(bodyContainer) {
        const modeRadios = bodyContainer.querySelectorAll('input[name="deliveryType"]');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.draft.deliveryType = e.target.value === 'pickup' ? 'pickup' : 'home_delivery';
                this.saveShippingDraft();

                bodyContainer.querySelectorAll('.delivery-mode-card').forEach(card => {
                    const checked = card.querySelector('input')?.value === this.draft.deliveryType;
                    card.classList.toggle('active', checked);
                });

                const addrBox = document.getElementById('home-delivery-fields');
                const pickupBox = document.getElementById('pickup-info-card');
                if (addrBox) addrBox.style.display = this.draft.deliveryType === 'pickup' ? 'none' : 'block';
                if (pickupBox) pickupBox.style.display = this.draft.deliveryType === 'pickup' ? 'block' : 'none';

                this.hideCheckoutError();
                this.updateShippingBannerAndTotals();
            });
        });

        const fieldMap = [
            ['chk-fullName', 'fullName'],
            ['chk-dni', 'dni'],
            ['chk-phone', 'phone'],
            ['chk-email', 'email'],
            ['chk-province', 'province'],
            ['chk-postalCode', 'postalCode'],
            ['chk-city', 'city'],
            ['chk-streetName', 'streetName'],
            ['chk-streetNumber', 'streetNumber'],
            ['chk-apartment', 'apartment'],
            ['chk-reference', 'reference']
        ];

        fieldMap.forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(eventName, (e) => {
                this.draft[key] = e.target.value;
                this.saveShippingDraft();
                this.hideCheckoutError();
                if (key === 'province' || key === 'postalCode') {
                    this.updateShippingBannerAndTotals();
                }
            });
        });

        document.getElementById('btn-pay-mercadopago')?.addEventListener('click', () => this.handleMercadoPagoCheckout());
    }

    updateShippingBannerAndTotals() {
        this.renderFreeShippingStrip();

        const subtotal = this.calculateTotal();
        const quote = this.getShippingQuote();

        const quoteBox = document.getElementById('shipping-quote-box');
        if (quoteBox) {
            if (!quote.ready) {
                quoteBox.innerHTML = `
                    <div class="quote-pending">
                        <i class="fa-solid fa-location-crosshairs"></i>
                        <span>Selecciona tu <strong>provincia y código postal</strong> para calcular el costo de envío.</span>
                    </div>
                `;
            } else if (quote.isFree) {
                quoteBox.innerHTML = `
                    <div class="quote-ready free">
                        <div>
                            <strong>${window.escaparHTML(quote.zoneLabel)}</strong>
                            <small>${window.escaparHTML(quote.eta)} · Peso est. ${quote.estimatedWeightKg} kg</small>
                        </div>
                        <span class="quote-price-badge">GRATIS</span>
                    </div>
                `;
            } else {
                quoteBox.innerHTML = `
                    <div class="quote-ready">
                        <div>
                            <strong>${window.escaparHTML(quote.zoneLabel)}</strong>
                            <small>${window.escaparHTML(quote.eta)} · Peso est. ${quote.estimatedWeightKg} kg</small>
                        </div>
                        <span class="quote-price">${window.formatearPrecio(quote.cost)}</span>
                    </div>
                `;
            }
        }

        const elSub = document.getElementById('checkout-subtotal-val');
        const elShipLbl = document.getElementById('checkout-shipping-label');
        const elShipVal = document.getElementById('checkout-shipping-summary');
        const elGrand = document.getElementById('checkout-grand-total');

        if (elSub) elSub.textContent = window.formatearPrecio(subtotal);
        if (elShipLbl) {
            elShipLbl.textContent = quote.deliveryType === 'pickup' ? 'Retiro en local' : 'Envío';
        }
        if (elShipVal) {
            if (!quote.ready && !quote.isFree) {
                elShipVal.textContent = 'A cotizar';
                elShipVal.className = '';
            } else if (quote.isFree) {
                elShipVal.textContent = 'GRATIS';
                elShipVal.className = 'free-badge-text';
            } else {
                elShipVal.textContent = window.formatearPrecio(quote.cost);
                elShipVal.className = '';
            }
        }
        if (elGrand) {
            const shippingCost = Number(quote.cost || 0);
            elGrand.textContent = window.formatearPrecio(subtotal + shippingCost);
        }
    }

    showCheckoutError(message) {
        const box = document.getElementById('checkout-form-error');
        if (!box) {
            this.showNotification(message);
            return;
        }
        box.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${window.escaparHTML(message)}</span>`;
        box.style.display = 'flex';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideCheckoutError() {
        const box = document.getElementById('checkout-form-error');
        if (box) box.style.display = 'none';
    }

    validateCheckoutForm() {
        const fullName = String(this.draft.fullName || '').trim();
        const dni = String(this.draft.dni || '').replace(/\D/g, '');
        const phone = String(this.draft.phone || '').replace(/\D/g, '');
        const email = String(this.draft.email || '').trim();

        if (fullName.length < 4 || !fullName.includes(' ')) {
            return { ok: false, error: 'Ingresa tu Nombre y Apellido completos.' };
        }
        if (dni.length < 7 || dni.length > 11) {
            return { ok: false, error: 'Ingresa un DNI o CUIL válido (7 a 11 dígitos, sin puntos).' };
        }
        if (phone.length < 8 || phone.length > 15) {
            return { ok: false, error: 'Ingresa un número de WhatsApp válido con código de área.' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { ok: false, error: 'Ingresa un correo electrónico válido.' };
        }

        if (this.draft.deliveryType === 'home_delivery') {
            if (!String(this.draft.province || '').trim()) {
                return { ok: false, error: 'Selecciona tu provincia para calcular el envío.' };
            }
            if (String(this.draft.postalCode || '').replace(/\D/g, '').length < 4) {
                return { ok: false, error: 'Ingresa tu Código Postal (4 dígitos).' };
            }
            if (String(this.draft.city || '').trim().length < 2) {
                return { ok: false, error: 'Ingresa tu Ciudad o Localidad.' };
            }
            if (String(this.draft.streetName || '').trim().length < 2) {
                return { ok: false, error: 'Ingresa el nombre de la calle.' };
            }
            if (!String(this.draft.streetNumber || '').trim()) {
                return { ok: false, error: 'Ingresa la altura (número o S/N).' };
            }
        }

        return {
            ok: true,
            buyer: { fullName, dni, phone, email },
            shipping: {
                deliveryType: this.draft.deliveryType,
                province: this.draft.deliveryType === 'pickup' ? 'Misiones' : String(this.draft.province || '').trim(),
                postalCode: this.draft.deliveryType === 'pickup' ? '3350' : String(this.draft.postalCode || '').trim(),
                city: this.draft.deliveryType === 'pickup' ? 'Apóstoles' : String(this.draft.city || '').trim(),
                streetName: this.draft.deliveryType === 'pickup' ? (window.NEGOCIO?.direccion || 'San Lorenzo 19') : String(this.draft.streetName || '').trim(),
                streetNumber: this.draft.deliveryType === 'pickup' ? '' : String(this.draft.streetNumber || '').trim(),
                apartment: String(this.draft.apartment || '').trim(),
                reference: String(this.draft.reference || '').trim()
            }
        };
    }

    async handleMercadoPagoCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Tu carrito está vacío');
            return;
        }
        if (this.isSubmittingMP) return;

        const validation = this.validateCheckoutForm();
        if (!validation.ok) {
            this.showCheckoutError(validation.error);
            return;
        }

        const btnMP = document.getElementById('btn-pay-mercadopago');
        const originalHTML = btnMP?.innerHTML || '';
        this.isSubmittingMP = true;
        if (btnMP) {
            btnMP.disabled = true;
            btnMP.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>CONECTANDO CON MERCADO PAGO...</span>';
        }

        try {
            const payload = {
                items: this.cart.map(i => ({
                    id: i.id,
                    size: i.size || 'U',
                    quantity: Number(i.quantity || 1)
                })),
                buyer: validation.buyer,
                shipping: validation.shipping
            };

            const res = await fetch('/api/crear-preferencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 404 || res.status === 405) {
                throw new Error('La pasarela online requiere entorno Vercel o serverless activo.');
            }

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok || !data.init_point) {
                throw new Error(data.error || 'No se pudo iniciar el pago con Mercado Pago.');
            }

            // Respaldo local de la orden creada
            this.saveLocalOrderSnapshot({
                id: data.orderId,
                date: new Date().toISOString(),
                status: 'pending',
                paymentMethod: 'mercadopago',
                paymentStatus: 'pending_payment',
                subtotal: data.subtotal,
                shippingCost: data.shippingCost,
                total: data.total,
                itemsCount: this.cart.reduce((acc, i) => acc + Number(i.quantity || 1), 0),
                items: [...this.cart],
                customer: validation.buyer.fullName,
                email: validation.buyer.email,
                buyer: validation.buyer,
                shipping: validation.shipping
            });

            const overlay = document.querySelector('.checkout-overlay');
            const overlayText = overlay?.querySelector('.checkout-text');
            if (overlayText) overlayText.textContent = 'Redirigiendo a Mercado Pago...';
            overlay?.classList.add('active');

            setTimeout(() => {
                window.location.href = data.init_point;
            }, 450);
        } catch (err) {
            this.showCheckoutError(err.message || 'Error conectando con Mercado Pago.');
            if (btnMP) {
                btnMP.disabled = false;
                btnMP.innerHTML = originalHTML;
            }
            this.isSubmittingMP = false;
        }
    }

    handleCheckout(e) {
        if (e) e.preventDefault();

        if (this.cart.length === 0) {
            this.showNotification('Tu carrito está vacío');
            return;
        }

        if (this.checkoutStep !== 'shipping') {
            this.checkoutStep = 'shipping';
            this.renderCart();
            return;
        }

        const validation = this.validateCheckoutForm();
        if (!validation.ok) {
            this.showCheckoutError(validation.error);
            return;
        }

        const subtotal = this.calculateTotal();
        const quote = this.getShippingQuote();
        const shippingCost = Number(quote.cost || 0);
        const total = subtotal + shippingCost;
        const orderId = `UH-${Date.now()}`;

        const shippingFull = {
            ...validation.shipping,
            zoneId: quote.zoneId,
            zoneLabel: quote.zoneLabel,
            eta: quote.eta,
            estimatedWeightKg: quote.estimatedWeightKg,
            trackingCode: ''
        };

        const overlay = document.querySelector('.checkout-overlay');
        const overlayText = overlay?.querySelector('.checkout-text');
        if (overlayText) overlayText.textContent = 'Preparando Pedido...';
        if (overlay) overlay.classList.add('active');

        setTimeout(() => {
            this.recordOrder({
                id: orderId,
                buyer: validation.buyer,
                shipping: shippingFull,
                subtotal,
                shippingCost,
                total
            });

            let message = `¡Hola UrbanHustler! 👋 Quiero confirmar el pedido *#${orderId}*:\n\n`;
            this.cart.forEach(item => {
                message += `▪️ [COD: ${item.id}] ${item.name} (Talle: ${item.size}) x${item.quantity}\n`;
            });

            const fmt = window.formatearPrecio || ((n) => '$' + Number(n).toLocaleString('es-AR'));
            message += `\n🛍️ Subtotal prendas: ${fmt(subtotal)}`;
            message += `\n🚚 Entrega: ${shippingFull.deliveryType === 'pickup' ? 'Retiro GRATIS en Local' : `${shippingFull.zoneLabel} (${shippingCost === 0 ? 'GRATIS' : fmt(shippingCost)})`}`;
            message += `\n💰 *Total Final: ${fmt(total)}*`;

            message += `\n\n👤 *Datos de contacto:*`;
            message += `\n• Nombre: ${validation.buyer.fullName}`;
            message += `\n• DNI: ${validation.buyer.dni}`;
            message += `\n• Tel: ${validation.buyer.phone}`;
            message += `\n• Email: ${validation.buyer.email}`;

            if (shippingFull.deliveryType === 'home_delivery') {
                message += `\n\n📍 *Dirección de envío:*`;
                message += `\n• ${shippingFull.streetName} ${shippingFull.streetNumber}${shippingFull.apartment ? ` (${shippingFull.apartment})` : ''}`;
                message += `\n• ${shippingFull.city}, ${shippingFull.province} (CP: ${shippingFull.postalCode})`;
                if (shippingFull.reference) message += `\n• Ref: ${shippingFull.reference}`;
            }

            message += '\n\n¡Quedo atento para coordinar el pago!';

            const phoneNumber = window.NEGOCIO?.whatsapp || '5493758555948';
            const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            const link = document.createElement('a');
            link.href = url;
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            link.target = isIOS ? '_self' : '_blank';
            link.rel = 'noopener noreferrer';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.renderCart();
            this.closeCart();
            this.showNotification(`Pedido #${orderId} registrado`);

            if (overlay) overlay.classList.remove('active');
        }, 900);
    }

    saveLocalOrderSnapshot(newOrder) {
        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
            if (!Array.isArray(orders)) orders = [];
        } catch (e) {
            orders = [];
        }

        const idx = orders.findIndex(o => String(o.id) === String(newOrder.id));
        if (idx > -1) orders[idx] = newOrder;
        else orders.push(newOrder);

        try {
            localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
        } catch (e) {}
    }

    recordOrder(details) {
        const userInfo = window.obtenerUsuarioActual ? (window.obtenerUsuarioActual() || {}) : {};
        const buyer = details?.buyer || {};
        const newOrder = {
            id: details?.id || `UH-${Date.now()}`,
            date: new Date().toISOString(),
            subtotal: details?.subtotal ?? this.calculateTotal(),
            shippingCost: details?.shippingCost ?? 0,
            total: details?.total ?? this.calculateTotal(),
            itemsCount: this.cart.reduce((acc, item) => acc + Number(item.quantity || 1), 0),
            items: [...this.cart],
            customer: buyer.fullName || userInfo.name || 'Cliente Web',
            email: buyer.email || userInfo.email || 'Concretado por WhatsApp',
            buyer,
            shipping: details?.shipping || { deliveryType: 'pickup' },
            paymentMethod: 'whatsapp',
            paymentStatus: 'pending_payment',
            shippingStatus: details?.shipping?.deliveryType === 'pickup' ? 'ready_pickup' : 'pending_dispatch',
            status: 'pending'
        };

        this.saveLocalOrderSnapshot(newOrder);

        if (window.firebaseManager) {
            window.firebaseManager.saveOrder(newOrder);
        }
    }

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

window.cartManager = new CartManager();
