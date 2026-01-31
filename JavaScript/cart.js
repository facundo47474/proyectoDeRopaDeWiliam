/**
 * CartManager
 * Gestiona la lógica del carrito de compras, persistencia y renderizado.
 */
class CartManager {
    constructor() {
        // Cargar carrito desde localStorage o iniciar vacío
        this.cart = JSON.parse(localStorage.getItem('urbanHustlerCart')) || [];
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo para inyectar HTML y buscar elementos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // 1. Inyectar HTML del carrito si no existe en la página
        if (!document.querySelector('.cart-drawer')) {
            this.injectCartHTML();
        }

        // 2. Cachear elementos del DOM
        this.cartDrawer = document.querySelector('.cart-drawer');
        this.cartOverlay = document.querySelector('.cart-overlay');
        this.cartItemsContainer = document.querySelector('.cart-items-container');
        this.cartTotalElement = document.querySelector('.cart-total span:last-child');
        this.cartCountElements = document.querySelectorAll('.cart-count-badge');

        // Listener para el botón de Checkout
        const checkoutBtn = document.querySelector('.btn-checkout');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                this.handleCheckout(e);
            });
        }

        // Event Listeners para abrir/cerrar el carrito
        // Busca cualquier botón que deba abrir el carrito (iconos en navbar)
        document.addEventListener('click', (e) => {
            const target = e.target;
            // Detectar botón por clase/ID explícito O por ser un icono de carrito en el navbar
            const isExplicitTrigger = target.closest('.cart-trigger') || target.closest('#cart-btn');
            const isCartIcon = target.closest('.fa-cart-shopping') || target.closest('.fa-shopping-cart') || target.closest('.fa-bag-shopping');
            const isNavbarContext = target.closest('.nav-icons') || target.closest('.navbar');

            if (isExplicitTrigger || (isCartIcon && isNavbarContext)) {
                e.preventDefault();
                this.openCart();
            }
        });

        const closeBtn = document.querySelector('.close-cart');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeCart());

        if (this.cartOverlay) this.cartOverlay.addEventListener('click', () => this.closeCart());

        // Render inicial al cargar la página
        this.renderCart();

        // Escuchar cuando el navbar se cargue para actualizar los contadores (badges)
        document.addEventListener('app:navbar-loaded', () => {
            this.cartCountElements = document.querySelectorAll('.cart-count-badge');
            this.updateCartCount();
        });
    }

    injectCartHTML() {
        const cartHTML = `
            <div class="cart-overlay"></div>
            <div class="cart-drawer">
                <div class="cart-header">
                    <h3>Tu Carrito</h3>
                    <button class="close-cart"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="cart-items-container"></div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total</span>
                        <span>$0</span>
                    </div>
                    <button class="btn-checkout">Iniciar Compra</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    handleCheckout(e) {
        e.preventDefault();
        
        // Verificar Login
        const userToken = localStorage.getItem('user_token');
        
        if (!userToken) {
            this.showNotification("🔒 Debes iniciar sesión para comprar");
            this.closeCart();
            // Resaltar botón de login en navbar si existe
            const loginContainer = document.getElementById('google-login-container');
            if (loginContainer) {
                loginContainer.scrollIntoView({ behavior: 'smooth' });
                loginContainer.style.transition = "transform 0.3s";
                loginContainer.style.transform = "scale(1.2)";
                setTimeout(() => loginContainer.style.transform = "scale(1)", 500);
            }
            return;
        }

        // Lógica de compra (Simulada)
        if (this.cart.length === 0) {
            this.showNotification("Tu carrito está vacío");
            return;
        }

        alert("¡Compra procesada con éxito! Gracias por elegir UrbanHustler.");
        this.cart = [];
        this.saveCart();
        this.renderCart();
        this.closeCart();
    }

    openCart() {
        if (this.cartDrawer) this.cartDrawer.classList.add('open');
        if (this.cartOverlay) this.cartOverlay.classList.add('active');
    }

    closeCart() {
        if (this.cartDrawer) this.cartDrawer.classList.remove('open');
        if (this.cartOverlay) this.cartOverlay.classList.remove('active');
    }

    /**
     * Agrega un producto al carrito
     */
    addItem(product, quantity = 1, size = 'M') {
        // Verificar si el producto ya existe con el mismo ID y Talle
        const existingItemIndex = this.cart.findIndex(item => item.id === product.id && item.size === size);

        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image, // Asegúrate de que el objeto producto tenga esta propiedad
                size: size,
                quantity: quantity
            });
        }

        this.saveCart();
        this.renderCart();
        this.openCart(); // Abrir carrito automáticamente para feedback visual
        this.showNotification(`Agregado: ${product.name}`);
    }

    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.renderCart();
    }

    updateQuantity(index, change) {
        const item = this.cart[index];
        const newQty = item.quantity + change;

        if (newQty > 0) {
            item.quantity = newQty;
        } else {
            // Si baja a 0, no hacemos nada o podríamos eliminarlo. 
            // Por UX, mejor dejarlo en 1 y que el usuario use el botón de eliminar.
            item.quantity = 1;
        }

        this.saveCart();
        this.renderCart();
    }

    calculateTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    saveCart() {
        localStorage.setItem('urbanHustlerCart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    updateCartCount() {
        const count = this.cart.reduce((acc, item) => acc + item.quantity, 0);
        this.cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    renderCart() {
        if (!this.cartItemsContainer) return;

        this.cartItemsContainer.innerHTML = '';

        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; margin-bottom: 1rem; color: #333;"></i>
                    <p>Tu carrito está vacío.</p>
                    <button onclick="window.location.href='catalogo.html'" class="btn-shop" style="margin-top: 1rem; width: auto;">Ir a la Tienda</button>
                </div>
            `;
            if (this.cartTotalElement) this.cartTotalElement.textContent = '$0';
            this.updateCartCount();
            return;
        }

        this.cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-meta">Talle: ${item.size} | $${item.price.toLocaleString()}</div>
                    <div class="cart-item-controls">
                        <button class="btn-qty" onclick="window.cartManager.updateQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn-qty" onclick="window.cartManager.updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="btn-remove" onclick="window.cartManager.removeItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            this.cartItemsContainer.appendChild(cartItem);
        });

        if (this.cartTotalElement) {
            this.cartTotalElement.textContent = `$${this.calculateTotal().toLocaleString()}`;
        }
        this.updateCartCount();
    }

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight; 
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Inicializar globalmente para que otros scripts puedan acceder
window.cartManager = new CartManager();