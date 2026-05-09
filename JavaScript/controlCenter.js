/**
 * ControlCenterManager
 * Gestiona la lógica y métricas del Panel de Control Administrativo.
 */
class ControlCenterManager {
    constructor() {
        this.allProducts = []; // Inicialización segura
        this.init();
    }

    init() {
        // --- SEGURIDAD: VERIFICAR PERMISOS DE ADMINISTRADOR ---
        const authorizedEmails = ['gimenez.william07@gmail.com', 'facundotomas018@gmail.com'];
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');

        if (!userInfo.email || !authorizedEmails.includes(userInfo.email)) {
            console.warn("⛔ Intento de acceso no autorizado al panel.");
            document.body.innerHTML = '<div style="height:100vh;background:#000;display:flex;justify-content:center;align-items:center;color:#2ecc71;font-size:2rem;font-weight:bold;font-family:sans-serif;">ACCESO DENEGADO</div>';
            alert('⛔ No tienes permisos para acceder a esta sección.');
            window.location.href = 'index.html';
            return; // Detener ejecución inmediata
        }

        // Asegurar que el DOM esté cargado antes de buscar elementos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }

        // Función para recargar datos de la nube
        const reloadCloudData = () => {
            console.log("🔄 Recargando panel con datos de la nube...");
            this.loadProducts(); // recargar inventario real
            this.loadUsers();
            this.loadMetrics();
            this.loadExperience();
        };

        // Si Firebase ya está listo, cargar inmediatamente. Si no, esperar al evento.
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            reloadCloudData();
        } else {
            document.addEventListener('firebase-ready', reloadCloudData);
        }
    }

    start() {
        this.setupNavigation();
        this.initCategoriesManager();
        this.initProductsManager();
        this.initUsersManager();
        this.initExperienceManager();
        this.setupChartFilter();
        this.initSalesHistory(); // Nuevo módulo de historial
        this.initOrdersManagement(); // Nuevo módulo de gestión de pedidos
        this.loadMetrics();
        // Actualizar métricas cada 5 segundos para dar efecto de "tiempo real"
        setInterval(() => this.loadMetrics(), 5000);
    }

    initCategoriesManager() {
        // Inicializar categorías por defecto si no existen
        if (!localStorage.getItem('urbanHustlerCategories')) {
            const defaults = [
                { id: 'hoodie', name: 'Hoodie' },
                { id: 'pants', name: 'Pantalones' },
                { id: 'tshirt', name: 'Remeras' },
                { id: 'accessories', name: 'Accesorios' }
            ];
            localStorage.setItem('urbanHustlerCategories', JSON.stringify(defaults));
        }

        // Listeners para el modal de categorías
        const manageBtn = document.getElementById('btn-manage-categories');
        const modal = document.getElementById('manage-categories-modal');
        const closeBtn = document.getElementById('close-categories-modal');
        const addBtn = document.getElementById('btn-add-category');
        const input = document.getElementById('new-category-input');

        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                this.renderCategoriesList();
                modal.classList.add('active');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                this.populateCategorySelects(); // Actualizar dropdowns al cerrar
            });
        }

        if (addBtn && input) {
            addBtn.addEventListener('click', () => {
                const val = input.value.trim();
                if (val) {
                    this.addCategory(val);
                    input.value = '';
                }
            });
        }
        
        // Llenar select inicial
        this.populateCategorySelects();
    }

    getCategories() {
        return JSON.parse(localStorage.getItem('urbanHustlerCategories')) || [];
    }

    addCategory(name) {
        const cats = this.getCategories();
        const id = name.toLowerCase().replace(/\s+/g, '_');
        
        if (cats.find(c => c.id === id)) {
            alert('Esta categoría ya existe.');
            return;
        }
        
        cats.push({ id, name });
        localStorage.setItem('urbanHustlerCategories', JSON.stringify(cats));
        this.renderCategoriesList();
    }

    deleteCategory(id) {
        // PROTECCIÓN: "Ver Todo" es intocable
        if (id === 'all' || id === 'ver_todo') {
            alert('La categoría "Ver Todo" es fundamental para el sistema y no se puede eliminar.');
            return;
        }

        // Verificar si hay productos usando esta categoría antes de borrar
        // Usar caché en memoria si está disponible, sino localStorage
        const products = this.allProducts || JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const productsUsingCategory = products.filter(p => p.category === id);

        if (productsUsingCategory.length > 0) {
            const productNames = productsUsingCategory.map(p => `- ${p.name}`).join('\n');
            alert(`⚠️ No se puede eliminar esta categoría porque está asignada a los siguientes productos:\n\n${productNames}\n\nPor favor, edita estos productos y asígnales otra categoría antes de eliminarla.`);
            return;
        }

        if (confirm('¿Eliminar esta categoría?')) {
            let cats = this.getCategories();
            cats = cats.filter(c => c.id !== id);
            localStorage.setItem('urbanHustlerCategories', JSON.stringify(cats));
            this.renderCategoriesList();
        }
    }

    renderCategoriesList() {
        const list = document.getElementById('categories-list');
        if (!list) return;
        list.innerHTML = '';
        const cats = this.getCategories();
        
        cats.forEach(c => {
            const isProtected = c.id === 'all' || c.id === 'ver_todo';
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #333; align-items: center; background: #222; color: #fff; margin-bottom: 5px; border-radius: 4px;';
            
            let actionHtml = '';
            if (isProtected) {
                actionHtml = '<span style="color: #666; font-size: 0.8rem; font-style: italic;"><i class="fa-solid fa-lock"></i> Sistema</span>';
            } else {
                actionHtml = `
                <button class="btn-sm btn-secondary delete-cat-btn" data-id="${c.id}" style="background: #dc3545; color: white; border: none;">
                    <i class="fa-solid fa-trash"></i>
                </button>`;
            }

            li.innerHTML = `
                <span>${c.name}</span>
                ${actionHtml}
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteCategory(e.target.closest('button').dataset.id);
            });
        });
    }

    populateCategorySelects() {
        const select = document.getElementById('edit-category');
        if (!select) return;
        
        const currentVal = select.value;
        select.innerHTML = '';
        const cats = this.getCategories();
        
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });

        // Intentar mantener selección previa si existe
        if (cats.find(c => c.id === currentVal)) {
            select.value = currentVal;
        }
    }

    initUsersManager() {
        this.loadUsers();
        
        // Escuchar cambios en tiempo real (por si alguien se registra en otra pestaña)
        window.addEventListener('storage', (e) => {
            if (e.key === 'urbanHustlerUsers') this.loadUsers();
        });
    }

    async loadUsers() {
        let users = null;
        // Intentar cargar de la nube primero
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            users = await window.firebaseManager.getCollection('users');
        }
        
        if (users !== null) {
            localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));
        } else {
            users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
        }
        this.renderUsersTable(users);
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay usuarios registrados aún.</td></tr>';
            return;
        }

        // Ordenar por fecha descendente
        users.sort((a, b) => new Date(b.date) - new Date(a.date));

        users.forEach(user => {
            // Definir estilo según la fuente (Google o Newsletter)
            let sourceBadge = '';
            if (user.source === 'google') {
                sourceBadge = `<span style="display:inline-flex; align-items:center; gap:5px; padding: 5px 10px; border-radius: 15px; background: #e8f0fe; color: #1a73e8; font-size: 0.85rem; font-weight: 700; border: 1px solid rgba(26, 115, 232, 0.2);">
                    <i class="fa-brands fa-google"></i> Google
                </span>`;
            } else {
                sourceBadge = `<span style="display:inline-flex; align-items:center; gap:5px; padding: 5px 10px; border-radius: 15px; background: #e6fffa; color: #00796b; font-size: 0.85rem; font-weight: 700; border: 1px solid rgba(0, 121, 107, 0.2);">
                    <i class="fa-solid fa-envelope"></i> Newsletter
                </span>`;
            }

            const userImage = user.picture ? `<img src="${user.picture}" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:8px;">` : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:#888;">${new Date(user.date).toLocaleDateString()} <small>${new Date(user.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small></td>
                <td style="font-weight:500; color:#fff;">${userImage}${user.name || 'Suscriptor'}</td>
                <td style="color:#ccc;">${user.email}</td>
                <td>${sourceBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- GESTIÓN DE EXPERIENCIA (COMENTARIOS) ---
    initExperienceManager() {
        this.loadExperience();
        
        // Escuchar cambios en storage local
        window.addEventListener('storage', (e) => {
            if (e.key === 'urbanHustlerComments') this.loadExperience();
        });
    }

    async loadExperience() {
        let comments = null;
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            comments = await window.firebaseManager.getCollection('comments');
        }
        
        if (comments !== null) {
            localStorage.setItem('urbanHustlerComments', JSON.stringify(comments));
        } else {
            comments = JSON.parse(localStorage.getItem('urbanHustlerComments')) || [];
        }
        this.renderExperienceTable(comments);
    }

    renderExperienceTable(comments) {
        const tbody = document.getElementById('experience-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay comentarios aún.</td></tr>';
            return;
        }

        // Ordenar por fecha descendente
        comments.sort((a, b) => new Date(b.date) - new Date(a.date));

        comments.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(c.date).toLocaleDateString()}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.text}</td>
                <td>
                    <button class="btn-sm btn-secondary delete-comment-btn" data-id="${c.id}" style="background: #dc3545; color: white; border: none;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Listeners para eliminar
        tbody.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('button').dataset.id);
                this.deleteComment(id);
            });
        });
    }

    deleteComment(id) {
        if(confirm('¿Eliminar este comentario?')) {
            let comments = JSON.parse(localStorage.getItem('urbanHustlerComments')) || [];
            comments = comments.filter(c => c.id !== id);
            localStorage.setItem('urbanHustlerComments', JSON.stringify(comments));
            
            if (window.firebaseManager) {
                window.firebaseManager.deleteComment(id);
            }
            this.loadExperience();
        }
    }

    initProductsManager() {
        // 1. Cargar productos (LocalStorage o Mock DB)
        this.loadProducts();

        // 2. Configurar Modal
        // --- INYECCIÓN DE UI PARA EL CAMPO STOCK ---
        const priceInput = document.getElementById('edit-price');
        if (priceInput && !document.getElementById('edit-stock')) {
            const stockGroup = document.createElement('div');
            stockGroup.className = 'form-group';
            stockGroup.style.marginBottom = '15px';
            stockGroup.innerHTML = `
                <label style="display:block; margin-bottom:5px; color:#888;">Stock Disponible</label>
                <input type="number" id="edit-stock" min="0" placeholder="Ej: 5" 
                    style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: #fff; border-radius: 4px;">
            `;
            const priceContainer = priceInput.closest('.form-group') || priceInput.parentNode;
            priceContainer.parentNode.insertBefore(stockGroup, priceContainer.nextSibling);
        }

        const modal = document.getElementById('edit-product-modal');
        const cancelBtn = document.getElementById('cancel-edit');
        const form = document.getElementById('edit-product-form');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProductChanges();
            });
        }

        // Listener para Agregar Producto
        const addBtn = document.getElementById('btn-add-product');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // --- INYECCIÓN DE UI PARA MÚLTIPLES IMÁGENES ---
        const imageInput = document.getElementById('edit-image');
        if (imageInput && !document.getElementById('images-list-container')) {
            // Crear contenedor para lista dinámica
            const container = document.createElement('div');
            container.id = 'images-list-container';
            
            // Crear botón de agregar
            const addImgBtn = document.createElement('button');
            addImgBtn.type = 'button';
            addImgBtn.className = 'btn-sm btn-secondary';
            addImgBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar otra imagen';
            addImgBtn.style.cssText = 'margin-top: 10px; width: 100%; background: #333; color: #fff; border: 1px solid #555; padding: 8px; cursor: pointer;';
            addImgBtn.onclick = () => this.addImageInput('');

            // Insertar en el DOM
            imageInput.parentNode.insertBefore(container, imageInput.nextSibling);
            imageInput.parentNode.insertBefore(addImgBtn, container.nextSibling);
            
            // Ocultar input original (se mantiene por compatibilidad pero no se ve)
            imageInput.style.display = 'none';
        }
    }

    setupChartFilter() {
        const filter = document.getElementById('chart-filter');
        if (filter) {
            filter.addEventListener('change', () => {
                // Recargar métricas inmediatamente para actualizar el gráfico
                this.loadMetrics();
            });
        }
    }

    async loadProducts() {
        let products = [];
        
        // Intentar cargar de la nube
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            const cloudProducts = await window.firebaseManager.getCollection('products');
            if (cloudProducts !== null) { // Puede ser un array vacío
                products = cloudProducts;
                // Intentamos guardar en local, pero si falla no detenemos la ejecución
                try {
                    localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
                } catch (e) {
                    console.warn("⚠️ LocalStorage lleno (Panel). Usando memoria RAM para gestionar productos.");
                }
            }
        }

        // Fallback a LocalStorage/Mock si la nube está vacía o no disponible
        if (products.length === 0) {
            const storedProducts = JSON.parse(localStorage.getItem('urbanHustlerProducts'));
            if (storedProducts && Array.isArray(storedProducts)) {
                products = storedProducts;
            }
        }

        // Asignación automática de stock de 5 a productos existentes que no tengan el campo
        products = products.map(p => ({
            ...p,
            stock: (p.stock !== undefined) ? parseInt(p.stock) : 5
        }));

        // Guardamos en memoria de la clase para uso en otras funciones (editar/borrar) sin depender de localStorage
        this.allProducts = products;
        this.renderProductsTable(products || []);
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Actualizar encabezado de la tabla si no existe la columna Stock
        const tableHeader = document.querySelector('.admin-table thead tr');
        if (tableHeader && !tableHeader.innerHTML.includes('Stock')) {
            const actionsHeader = tableHeader.querySelector('th:last-child');
            const stockTh = document.createElement('th');
            stockTh.textContent = 'Stock';
            tableHeader.insertBefore(stockTh, actionsHeader);
        }

        products.forEach(product => {
            // DETECCIÓN: Verificamos si la imagen empieza con "data:" (Base64/Viejo) o "http" (Storage/Nuevo)
            const isOptimized = product.image && product.image.startsWith('http');
            const statusIcon = isOptimized 
                ? '<span title="✅ Optimizado (Nube)" style="color:#2ecc71; margin-left:8px; font-size: 0.9rem;">☁️</span>'
                : '<span title="⚠️ Método Viejo (Pesado). Edita y resube la imagen para arreglarlo." style="color:#f1c40f; margin-left:8px; cursor:help; font-size: 1.1rem;">⚠️</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="display: flex; align-items: center;">
                    <img src="${product.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    ${statusIcon}
                </td>
                <td>${product.name}</td>
                <td>${window.formatPrice ? window.formatPrice(product.price) : '$' + product.price.toLocaleString()}</td>
                <td>${product.sizes ? product.sizes.join(', ') : '-'}</td>
                <td style="font-weight: bold; color: ${product.stock < 3 ? '#dc3545' : '#2ecc71'}">${product.stock}</td>
                <td>
                    <button class="btn-sm btn-primary edit-btn" data-id="${product.id}">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="btn-sm btn-secondary delete-btn" data-id="${product.id}" style="background: #dc3545; color: white; border: none; margin-left: 5px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Agregar listeners a los botones de editar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Buscar el botón (puede que el click sea en el icono)
                const target = e.target.closest('.edit-btn');
                const id = parseInt(target.getAttribute('data-id'));
                this.openEditModal(id);
            });
        });

        // Agregar listeners a los botones de eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.delete-btn');
                const id = parseInt(target.getAttribute('data-id'));
                this.deleteProduct(id);
            });
        });
    }

    setupNavigation() {
        // Usar delegación de eventos en el documento para capturar clics
        // tanto en el Sidebar como en el Navbar (que se carga dinámicamente)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.admin-nav-link');
            if (!link) return;

            // Si es un enlace normal (como volver a tienda), dejar que navegue
            if (!link.hasAttribute('data-target')) return;

            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const views = document.querySelectorAll('.admin-view');
            const allLinks = document.querySelectorAll('.admin-nav-link');

            // 1. Actualizar estado activo en TODOS los menús (Sidebar y Navbar)
            allLinks.forEach(l => {
                if (l.getAttribute('data-target') === targetId) {
                    l.classList.add('active');
                } else {
                    l.classList.remove('active');
                }
            });

            // 2. Mostrar la vista correspondiente
            views.forEach(view => {
                view.style.display = view.id === targetId ? 'block' : 'none';
            });

            // 3. Cerrar menú móvil del Navbar si está abierto
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const toggleIcon = document.querySelector('.menu-toggle i');
                if (toggleIcon) toggleIcon.className = 'fa-solid fa-bars';
            }
            
            // 4. Cerrar sidebar móvil si está abierto
            const sidebar = document.getElementById('admin-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            // Nota: navbar.js usa la clase 'active' para el sidebar y 'active' para el overlay
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }
        });
    }

    async loadMetrics() {
        // 1. Obtener Órdenes (Nube o Local)
        let orders = null;
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            orders = await window.firebaseManager.getCollection('orders');
        }
        
        if (orders !== null) {
            localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
        } else {
            orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
        }
        
        // Filtrar por estado
        const approvedOrders = orders.filter(o => o.status === 'approved');
        const pendingOrders = orders.filter(o => o.status === 'pending');

        const lastOrders = approvedOrders.slice(-5).reverse();
        const totalRevenue = approvedOrders.reduce((sum, order) => sum + order.total, 0);
        const pendingCount = pendingOrders.length;

        // 2. Productos (Solo conteo local por rendimiento rápido, o esperar async)
        // Para métricas rápidas usamos local, pero idealmente sería await this.loadProducts()
        const totalProducts = (this.allProducts || []).length;

        // 3. Métricas del Chatbot (Dato Real de la sesión actual)
        const currentChatHistory = JSON.parse(sessionStorage.getItem('chatbot_history')) || [];
        const totalChatInteractions = currentChatHistory.length;

        // 4. Actualizar el DOM (Busca elementos por ID)
        this.updateCard('metric-revenue', window.formatPrice ? window.formatPrice(totalRevenue) : `$${totalRevenue.toLocaleString()}`);
        
        this.updateCard('metric-orders', pendingCount);
        
        this.updateCard('metric-visitors', totalProducts);
        
        this.updateCard('metric-chatbot', totalChatInteractions);

        // 5. Actualizar la tabla de últimas órdenes
        this.updateOrderTable(lastOrders);

        // 6. Actualizar Gráfico
        this.updateChart(approvedOrders);
    }

    updateCard(elementId, value) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = value;
        }
    }

    updateCardColor(elementId, color) {
        const element = document.getElementById(elementId);
        const card = element.closest('.metric-card');

        if (card) {
            card.style.borderLeftColor = color;
            const icon = card.querySelector('.metric-icon');
            if (icon) {
                icon.style.color = color;
            }
        }
    }

    updateOrderTable(orders) {
        const tableBody = document.getElementById('latest-orders-body');
        if (!tableBody) return;
    
        tableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>${order.customer}</td>
                <td>${window.formatPrice ? window.formatPrice(order.total) : '$' + order.total.toLocaleString()}</td>
                <td>${order.itemsCount}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    updateChart(orders) {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Obtener filtro seleccionado
        const filterElement = document.getElementById('chart-filter');
        const filterValue = filterElement ? filterElement.value : 'all';
        const now = new Date();

        // Filtrar órdenes y Agrupar ventas por categoría
        const categoryStats = {};
        orders.forEach(order => { // Recibe solo approvedOrders
            // Lógica de filtrado por fecha
            let includeOrder = true;
            if (filterValue !== 'all') {
                const orderDate = new Date(order.date);
                const diffTime = Math.abs(now - orderDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (filterValue === '7days' && diffDays > 7) includeOrder = false;
                if (filterValue === '30days' && diffDays > 30) includeOrder = false;
            }

            if (includeOrder && order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const cat = item.category || 'Otros';
                    categoryStats[cat] = (categoryStats[cat] || 0) + (item.price * item.quantity);
                });
            }
        });

        const labels = Object.keys(categoryStats);
        const data = Object.values(categoryStats);

        // Si ya existe el gráfico, lo destruimos para actualizar
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sin datos'],
                datasets: [{
                    label: 'Ingresos por Categoría ($)',
                    data: data.length ? data : [0],
                    backgroundColor: '#2ecc71',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Ventas Totales por Categoría' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    attachActionListeners() {
        // Limpiar listeners antiguos clonando o simplemente reasignando (simple approach)
        // Para evitar duplicados, usaremos un enfoque delegado o reasignación simple
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = (e) => {
                const target = e.target.closest('.edit-btn');
                const id = parseInt(target.getAttribute('data-id'));
                this.openEditModal(id);
            };
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = (e) => {
                const target = e.target.closest('.delete-btn');
                const id = parseInt(target.getAttribute('data-id'));
                this.deleteProduct(id);
            };
        });
    }

    openAddModal(isDrop = false) {
        // Limpiar formulario para nuevo ingreso
        document.getElementById('edit-id').value = '';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-price').value = '';
        if (document.getElementById('edit-stock')) document.getElementById('edit-stock').value = '5';
        document.getElementById('edit-sizes').value = '';
        // document.getElementById('edit-image').value = ''; // Ya no se usa directo
        document.getElementById('edit-section').value = isDrop ? 'new_drops' : 'ropa';
        
        // Usar la primera categoría disponible por defecto
        const cats = this.getCategories();
        document.getElementById('edit-category').value = cats.length > 0 ? cats[0].id : '';
        
        document.getElementById('edit-gender').value = 'unisex';
        document.getElementById('edit-description').value = '';
        
        // Cambiar título del modal
        document.querySelector('#edit-product-modal h2').textContent = isDrop ? 'Nuevo Drop' : 'Nuevo Producto';
        document.getElementById('edit-product-modal').classList.add('active');

        // Resetear imágenes dinámicas
        document.getElementById('images-list-container').innerHTML = '';
        this.addImageInput(''); // Agregar al menos un campo vacío
    }

    openEditModal(id) {
        // Usar memoria RAM preferentemente
        const products = this.allProducts || JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const product = products.find(p => p.id === id);

        if (!product) return;

        document.querySelector('#edit-product-modal h2').textContent = 'Editar Producto';
        // Llenar formulario
        document.getElementById('edit-id').value = product.id;
        document.getElementById('edit-name').value = product.name;
        document.getElementById('edit-price').value = product.price;
        if (document.getElementById('edit-stock')) document.getElementById('edit-stock').value = (product.stock !== undefined) ? product.stock : 5;
        document.getElementById('edit-sizes').value = product.sizes ? product.sizes.join(', ') : '';
        // document.getElementById('edit-image').value = product.image;
        
        // Determinar sección basada en propiedades
        let section = 'ropa';
        if (product.isLatestDrop) section = 'new_drops';
        else if (product.category === 'combos') section = 'combos';
        else if (product.isOffer) section = 'ofertas';
        document.getElementById('edit-section').value = section;

        // Asegurar que la categoría exista en el select, si no, usar default
        const cats = this.getCategories();
        const catExists = cats.find(c => c.id === product.category);
        document.getElementById('edit-category').value = catExists ? product.category : (cats.length > 0 ? cats[0].id : '');
        
        document.getElementById('edit-gender').value = product.gender || 'unisex';
        document.getElementById('edit-description').value = product.description || '';

        // Mostrar modal
        document.getElementById('edit-product-modal').classList.add('active');

        // Cargar imágenes dinámicas
        const container = document.getElementById('images-list-container');
        container.innerHTML = '';
        // Usar array de imágenes si existe, sino usar la imagen única
        const imagesToLoad = (product.images && product.images.length > 0) ? product.images : [product.image];
        imagesToLoad.forEach(img => this.addImageInput(img));
    }

    saveProductChanges() {
        const idVal = document.getElementById('edit-id').value;
        const products = this.allProducts || JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const section = document.getElementById('edit-section').value;

        // Recolectar stock con validación (si está vacío o no existe el input, usar 5 por defecto)
        const stockInput = document.getElementById('edit-stock');
        const parsedStock = (stockInput && stockInput.value !== "") ? parseInt(stockInput.value) : 5;

        let newProduct = null; // Variable para almacenar el producto nuevo
        let index = -1; // Definimos index aquí para que sea accesible en toda la función

        // Configurar propiedades según la sección seleccionada
        let isLatestDrop = false;
        let isOffer = false;
        let category = document.getElementById('edit-category').value;

        if (section === 'new_drops') {
            isLatestDrop = true;
        } else if (section === 'combos') {
            category = 'combos';
        } else if (section === 'ofertas') {
            isOffer = true;
        }
        // 'ropa' usa los valores por defecto (todo false, categoría seleccionada)

        // Recolectar imágenes del UI dinámico
        const imageInputs = document.querySelectorAll('.image-url-input');
        const images = Array.from(imageInputs).map(input => input.value.trim()).filter(val => val !== '');

        if (idVal) {
            // MODO EDICIÓN (Existe ID)
            const id = parseInt(idVal);
            index = products.findIndex(p => p.id === id); // Usamos la variable externa
            if (index !== -1) {
            // Actualizar datos
            products[index].name = document.getElementById('edit-name').value;
            products[index].price = parseInt(document.getElementById('edit-price').value);
            products[index].stock = parsedStock;
            products[index].image = images[0] || products[index].image; // Portada
            products[index].images = images; // Array completo
            products[index].category = category;
            products[index].gender = document.getElementById('edit-gender').value;
            products[index].description = document.getElementById('edit-description').value;
            products[index].isLatestDrop = isLatestDrop;
            products[index].isOffer = isOffer;
            
            // Procesar talles
            const sizesStr = document.getElementById('edit-sizes').value;
            products[index].sizes = sizesStr.split(',').map(s => s.trim()).filter(s => s !== '');
            }
        } else {
            // MODO CREACIÓN (No existe ID)
            newProduct = {
                id: Date.now(), // Generar ID único basado en tiempo
                name: document.getElementById('edit-name').value,
                price: parseInt(document.getElementById('edit-price').value) || 0,
                stock: parsedStock,
                image: images[0] || 'https://via.placeholder.com/300',
                images: images,
                category: category,
                gender: document.getElementById('edit-gender').value,
                sizes: document.getElementById('edit-sizes').value.split(',').map(s => s.trim()).filter(s => s !== ''),
                description: document.getElementById('edit-description').value || 'Nuevo producto agregado desde el panel.',
                isLatestDrop: isLatestDrop,
                isOffer: isOffer
            };
            products.push(newProduct);
        }

        // Guardar y refrescar
        this.allProducts = products; // Actualizar memoria
        try {
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
        } catch (e) {
            console.warn("⚠️ No se pudo actualizar localStorage (Quota).");
        }
        
        
        // --- GUARDAR EN NUBE ---
        if (window.firebaseManager) {
            // Verificamos que el producto exista antes de guardar para evitar errores
            const productToSave = idVal ? (index !== -1 ? products[index] : null) : newProduct;
            if (productToSave) window.firebaseManager.saveProduct(productToSave);
        }

        this.loadProducts();
        document.getElementById('edit-product-modal').classList.remove('active');
        
        alert(idVal ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');

        // --- DISPARADOR DE CAMPAÑA DE EMAIL ---
        if (!idVal && newProduct) {
            this.triggerEmailCampaign(newProduct);
        }
    }

    deleteProduct(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
            let products = this.allProducts || JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
            products = products.filter(p => p.id !== id);
            
            this.allProducts = products; // Actualizar memoria
            try {
                localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            } catch(e) {
                console.warn("⚠️ No se pudo actualizar localStorage tras borrar.");
            }
            
            // --- BORRAR DE NUBE ---
            if (window.firebaseManager) {
                window.firebaseManager.deleteProduct(id);
            }
            this.loadProducts();
        }
    }

    // --- HELPER PARA INPUTS DE IMÁGENES ---
    addImageInput(value) {
        const container = document.getElementById('images-list-container');
        const wrapper = document.createElement('div');
        wrapper.className = 'image-input-wrapper';
        wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: #222; padding: 15px; border-radius: 8px; border: 1px solid #333;';
        
        // 1. Contenedor de Previsualización
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = 'width: 100%; height: 200px; background: #1a1a1a; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; border: 1px dashed #444;';
        
        const imgPreview = document.createElement('img');
        imgPreview.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; display: none;';
        
        const placeholderIcon = document.createElement('div');
        placeholderIcon.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="font-size: 3rem; color: #555; margin-bottom: 10px;"></i><p style="color: #666; margin: 0; font-size: 0.9rem;">Sin imagen seleccionada</p>';
        placeholderIcon.style.cssText = 'text-align: center; display: flex; flex-direction: column; align-items: center;';

        if (value) {
            imgPreview.src = value;
            imgPreview.style.display = 'block';
            placeholderIcon.style.display = 'none';
        }

        previewContainer.appendChild(placeholderIcon);
        previewContainer.appendChild(imgPreview);

        // 2. Input de Archivo (Visible)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.cssText = 'width: 100%; color: #ccc; font-size: 0.9rem; padding: 5px; background: #333; border-radius: 4px;';

        // 3. Input Oculto (Para guardar el valor Base64 o URL existente)
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden'; // Oculto
        hiddenInput.value = value || '';
        hiddenInput.className = 'image-url-input'; // Clase clave para saveProductChanges

        // Evento de cambio de archivo con compresión y conversión a WebP
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Feedback visual de carga
                placeholderIcon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #D90429;"></i><p style="color: #ccc; margin-top: 10px;">Comprimiendo imagen...</p>';
                imgPreview.style.display = 'none';
                placeholderIcon.style.display = 'flex';
                
                // --- MEJORA: COMPRESIÓN Y CONVERSIÓN A WEBP ---
                try {
                    await this.loadCompressionLibrary();

                    const options = {
                        maxSizeMB: 2,            // Permitimos hasta 2MB (fuente de alta calidad)
                        maxWidthOrHeight: 2048,  // 2K de resolución para nitidez
                        useWebWorker: true,      // Usar Web Worker para no bloquear UI
                        fileType: 'image/webp',  // Convertir a WebP
                        initialQuality: 0.9      // 90% de calidad para preservar detalles
                    };

                    console.log(`🖼️ Comprimiendo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
                    const compressedFile = await window.imageCompression(file, options);
                    console.log(`✅ Compresión exitosa: ${(compressedFile.size / 1024).toFixed(2)} KB`);

                    placeholderIcon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #D90429;"></i><p style="color: #ccc; margin-top: 10px;">Subiendo a Cloudinary...</p>';

                    // CAMBIO: Subir a Cloudinary (Gratis, profesional)
                    const downloadURL = await this.uploadToCloudinary(compressedFile);

                    if (downloadURL) {
                        imgPreview.src = downloadURL;
                        imgPreview.style.display = 'block';
                        placeholderIcon.style.display = 'none';
                        hiddenInput.value = downloadURL;
                    } else {
                        placeholderIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c;"></i><p>Error al subir</p>';
                        // El alert ya se muestra dentro de uploadToImgBB si falla por falta de API Key
                    }
                } catch (error) {
                    console.error("❌ Error en compresión/subida:", error);
                    placeholderIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c;"></i><p>Error al procesar</p>';
                    alert("Error al procesar la imagen. Intenta con otra.");
                }
            }
        });

        // 4. Botón de Eliminar
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Quitar';
        removeBtn.className = 'btn-sm btn-secondary';
        removeBtn.style.cssText = 'background: #dc3545; color: #fff; border: none; border-radius: 4px; padding: 8px; cursor: pointer; margin-top: 5px;';
        
        removeBtn.onclick = () => {
            if (container.querySelectorAll('.image-input-wrapper').length > 1) {
                wrapper.remove();
            } else {
                fileInput.value = '';
                hiddenInput.value = '';
                imgPreview.src = '';
                imgPreview.style.display = 'none';
                placeholderIcon.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="font-size: 3rem; color: #555; margin-bottom: 10px;"></i><p style="color: #666; margin: 0; font-size: 0.9rem;">Sin imagen seleccionada</p>';
                placeholderIcon.style.display = 'flex';
            }
        };

        wrapper.appendChild(previewContainer);
        wrapper.appendChild(fileInput);
        wrapper.appendChild(hiddenInput);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
    }

    // --- NUEVA FUNCIÓN: Subir a Cloudinary (Alternativa Gratis y Profesional) ---
    async uploadToCloudinary(file) {
        // ⚠️ IMPORTANTE: CONFIGURA ESTOS DATOS DE CLOUDINARY ⚠️
        // NO USES LA API KEY NI EL API SECRET AQUÍ (Es inseguro).
        // Sigue estos pasos:
        // 1. Ve a Settings (⚙️) > Upload > "Upload presets" > "Add upload preset".
        // 2. En "Signing Mode" selecciona "Unsigned" (¡Crucial!).
        // 3. Copia el "Cloud name" (Dashboard) y el "Upload preset name" (Settings) aquí:
        
        // REEMPLAZA ESTOS VALORES:
        const cloudName = "hurbanhustler";      // ✅ Cloud Name (en minúsculas por seguridad)
        const uploadPreset = "urban_uploads";   // ✅ Preset específico 'Unsigned'

        if (uploadPreset === "TU_UPLOAD_PRESET") {
            alert("⚠️ FALTA PRESET:\nDebes crear el preset 'urban_uploads' en Cloudinary como 'Unsigned'.");
            return null;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "urban_hustler_products"); // Carpeta organizada

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            
            if (response.ok) {
                return data.secure_url; // URL HTTPS segura y optimizada
            } else {
                throw new Error(data.error ? data.error.message : "Error desconocido en Cloudinary");
            }
        } catch (error) {
            console.error("❌ Error subiendo a Cloudinary:", error);
            alert("Error al subir imagen: " + error.message);
            return null;
        }
    }

    // --- MÓDULO DE HISTORIAL DE VENTAS ---
    initSalesHistory() {
        // Configurar redirección en la tarjeta de Ingresos ($)
        const revenueMetric = document.getElementById('metric-revenue');
        if (revenueMetric) {
            const card = revenueMetric.closest('.metric-card');
            if (card) {
                card.style.cursor = 'pointer';
                card.title = 'Ir al Historial de Ventas';
                card.onclick = () => window.location.href = 'salesHistory.html';
            }
        }
    }

    // --- MÓDULO DE GESTIÓN DE PEDIDOS PENDIENTES ---
    initOrdersManagement() {
        // Configurar redirección en la tarjeta de Pedidos
        const ordersMetric = document.getElementById('metric-orders');
        if (ordersMetric) {
            const card = ordersMetric.closest('.metric-card');
            if (card) {
                card.style.cursor = 'pointer';
                card.title = 'Gestionar Pedidos Pendientes';
                card.onclick = () => window.location.href = 'ordersManagement.html';
            }
        }
    }

    // --- MÓDULO DE EMAIL MARKETING (NUEVO) ---
    triggerEmailCampaign(product) {
        const users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
        
        // Filtrar emails únicos y válidos
        const uniqueEmails = [...new Set(users.map(u => u.email).filter(e => e))];

        if (uniqueEmails.length === 0) return;

        if (confirm(`🎉 Producto Creado Exitosamente.\n\n¿Deseas preparar una campaña de email para los ${uniqueEmails.length} suscriptores registrados?`)) {
            this.openEmailCampaignModal(product, uniqueEmails);
        }
    }

    openEmailCampaignModal(product, emails) {
        // 1. Generar Template HTML Profesional
        const emailHTML = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111111; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
    <div style="background: #27ae60; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; text-transform: uppercase; font-size: 28px; letter-spacing: 2px;">Nuevo Drop 🔥</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9);">Lo último de UrbanHustler ya está aquí</p>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
        <img src="${product.image}" style="width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" alt="${product.name}">
        <h2 style="font-size: 26px; margin: 10px 0; font-weight: 800;">${product.name}</h2>
        <p style="font-size: 22px; color: #2ecc71; font-weight: bold; margin: 5px 0;">${window.formatPrice ? window.formatPrice(product.price) : '$' + product.price.toLocaleString()}</p>
        <p style="color: #cccccc; line-height: 1.6; margin: 20px 0;">${product.description}</p>
        <a href="${window.location.origin}/detailProduct.html?id=${product.id}" style="display: inline-block; background: #ffffff; color: #000000; padding: 18px 40px; text-decoration: none; font-weight: bold; border-radius: 50px; margin-top: 25px; text-transform: uppercase; transition: transform 0.2s;">Comprar Ahora</a>
    </div>
    <div style="background: #1a1a1a; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #222;">
        UrbanHustler - Streetwear Premium<br>
        Enviado exclusivamente a nuestros suscriptores.
    </div>
</div>`;

        // 2. Crear Modal Dinámico
        const modalId = 'email-campaign-modal';
        let modal = document.getElementById(modalId);
        
        if (modal) modal.remove(); // Limpiar si existe

        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal active';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; background: #1A1A1A; color: #fff; border: 1px solid #333;">
                <div class="modal-header" style="border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="margin: 0;"><i class="fa-solid fa-paper-plane"></i> Campaña de Lanzamiento</h2>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; background: #222; padding: 15px; border-radius: 8px;">
                            <h4 style="margin-top: 0; color: #888;">Destinatarios (${emails.length})</h4>
                            <div style="max-height: 100px; overflow-y: auto; font-size: 0.85rem; color: #ccc;">
                                ${emails.join(', ')}
                            </div>
                        </div>
                        <div style="flex: 1; background: #222; padding: 15px; border-radius: 8px;">
                            <h4 style="margin-top: 0; color: #888;">Asunto</h4>
                            <input type="text" value="🔥 NUEVO DROP: ${product.name} disponible ahora" style="width: 100%; background: #333; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <h4 style="color: #888; margin-bottom: 10px;">Vista Previa del Correo:</h4>
                    <div style="background: #000; padding: 20px; border-radius: 8px; max-height: 400px; overflow-y: auto; border: 1px solid #333;">
                        ${emailHTML}
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="btn-copy-html" class="btn-secondary" style="padding: 12px 20px; background: #333; color: #fff; border: 1px solid #555; border-radius: 5px; cursor: pointer;">
                            <i class="fa-solid fa-copy"></i> Copiar HTML
                        </button>
                        <button id="btn-send-campaign" class="btn-primary" style="padding: 12px 25px; background: #27ae60; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            <i class="fa-solid fa-rocket"></i> Enviar Campaña
                        </button>
                    </div>
                    <div id="sending-progress" style="margin-top: 15px; display: none;">
                        <div style="height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
                            <div id="progress-bar" style="height: 100%; width: 0%; background: #2ecc71; transition: width 0.2s;"></div>
                        </div>
                        <p style="text-align: center; font-size: 0.8rem; color: #888; margin-top: 5px;">Procesando envío... <span id="progress-text">0%</span></p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 3. Lógica de Botones
        document.getElementById('btn-copy-html').onclick = () => {
            navigator.clipboard.writeText(emailHTML).then(() => alert('Código HTML copiado al portapapeles.'));
        };

        // Lógica de Envío (Integración con EmailJS)
        document.getElementById('btn-send-campaign').onclick = async () => {
            // --- CONFIGURACIÓN DE EMAILJS (REAL) ---
            // 1. Crea cuenta en https://www.emailjs.com/
            // 2. Reemplaza estos valores con los tuyos:
            const PUBLIC_KEY = "TU_PUBLIC_KEY"; // Ej: "user_XyZ..."
            const SERVICE_ID = "TU_SERVICE_ID"; // Ej: "service_gmail"
            const TEMPLATE_ID = "TU_TEMPLATE_ID"; // Ej: "template_promo"

            if (PUBLIC_KEY === "TU_PUBLIC_KEY") {
                alert("⚠️ AVISO: Para enviar correos reales, necesitas configurar EmailJS.\n\nEl sistema usará el modo SIMULACIÓN por ahora.\n\nPara activarlo: Edita 'controlCenter.js' y agrega tus claves de EmailJS.");
                this.simulateSending(emails, modal);
                return;
            }

            const btn = document.getElementById('btn-send-campaign');
            const originalText = btn.innerHTML;
            
            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

                // Cargar librería si falta
                if (!window.emailjs) await this.loadEmailJSLibrary();
                
                emailjs.init(PUBLIC_KEY);

                // Parámetros para el template de EmailJS
                const templateParams = {
                    to_email: emails.join(','), // Lista de correos
                    subject: document.querySelector('#email-campaign-modal input').value,
                    message_html: emailHTML, // El HTML generado
                    product_name: product.name,
                    product_link: window.location.origin + '/detailProduct.html?id=' + product.id
                };

                // Enviar
                await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);

                alert(`✅ ¡Campaña enviada con éxito a ${emails.length} suscriptores!`);
                modal.remove();

            } catch (error) {
                console.error("Error EmailJS:", error);
                alert("❌ Error al enviar: " + JSON.stringify(error));
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };
    }

    simulateSending(emails, modal) {
        const progressDiv = document.getElementById('sending-progress');
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('progress-text');
        progressDiv.style.display = 'block';
        
        let width = 0;
        const interval = setInterval(() => {
            width += Math.random() * 10;
            if (width > 100) width = 100;
            bar.style.width = width + '%';
            text.textContent = Math.floor(width) + '%';
            
            if (width === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    alert(`✅ [SIMULACIÓN] Campaña completada.\n(Configura EmailJS para envío real)`);
                    modal.remove();
                }, 500);
            }
        }, 200);
    }

    loadEmailJSLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Helper para cargar la librería de compresión de imágenes
    async loadCompressionLibrary() {
        if (window.imageCompression) return; // Ya cargada
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Inicializar el gestor del panel
new ControlCenterManager();
