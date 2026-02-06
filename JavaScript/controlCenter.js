/**
 * ControlCenterManager
 * Gestiona la lógica y métricas del Panel de Control Administrativo.
 */
class ControlCenterManager {
    constructor() {
        this.init();
    }

    init() {
        // Asegurar que el DOM esté cargado antes de buscar elementos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    start() {
        this.setupNavigation();
        this.initCategoriesManager();
        this.initProductsManager();
        this.initUsersManager();
        this.setupChartFilter();
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
        // Verificar si hay productos usando esta categoría antes de borrar
        const products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
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
            const li = document.createElement('li');
            li.style.cssText = 'display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; align-items: center;';
            li.innerHTML = `
                <span>${c.name}</span>
                <button class="btn-sm btn-secondary delete-cat-btn" data-id="${c.id}" style="background: #dc3545; color: white; border: none;">
                    <i class="fa-solid fa-trash"></i>
                </button>
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
        const users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
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
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(user.date).toLocaleDateString()}</td>
                <td>${user.name || 'Suscriptor'}</td>
                <td>${user.email}</td>
                <td><span style="padding: 4px 8px; border-radius: 4px; background: ${user.source === 'google' ? '#e8f0fe' : '#e6fffa'}; color: ${user.source === 'google' ? '#1a73e8' : '#00796b'}; font-size: 0.85rem; font-weight: 600;">${user.source === 'google' ? 'Google Login' : 'Newsletter'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    initProductsManager() {
        // 1. Cargar productos (LocalStorage o Mock DB)
        this.loadProducts();

        // 2. Configurar Modal
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

        // Listener para Agregar Drop (Desde la sección Latest Drops)
        const addDropBtn = document.getElementById('btn-add-drop');
        if (addDropBtn) {
            addDropBtn.addEventListener('click', () => this.openAddModal(true)); // true indica que es un Drop
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

    loadProducts() {
        // Intentar leer de LocalStorage, si no existe, usar MOCK_DB (de data.js)
        let products = JSON.parse(localStorage.getItem('urbanHustlerProducts'));
        
        if (!products && typeof MOCK_DB !== 'undefined') {
            products = MOCK_DB;
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
        }

        this.renderProductsTable(products || []);
        this.renderLatestDropsTable(products || []);
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${product.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>${product.name}</td>
                <td>$${product.price.toLocaleString()}</td>
                <td>${product.sizes ? product.sizes.join(', ') : '-'}</td>
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

    renderLatestDropsTable(products) {
        const tbody = document.getElementById('latest-drops-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Filtrar solo los que son Latest Drops
        const drops = products.filter(p => p.isLatestDrop === true);

        drops.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${product.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
                <td>${product.name}</td>
                <td>$${product.price.toLocaleString()}</td>
                <td>${product.category || '-'}</td>
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

        // Reutilizamos los listeners de editar/eliminar ya que usan data-id
        // (Se agregarán en el bloque general de listeners o podemos delegar eventos, 
        // pero para asegurar funcionamiento en ambas tablas, los listeners globales del DOM funcionan si se asignan bien)
        // Nota: En la implementación actual de renderProductsTable, los listeners se asignan a querySelectorAll('.edit-btn').
        // Al tener dos tablas, necesitamos re-asignar listeners a TODOS los botones después de renderizar ambas.
        this.attachActionListeners();
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
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }
        });
    }

    loadMetrics() {
        // 1. Calcular Ventas Totales y Pedidos (Leyendo del historial guardado por cart.js)
        const orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
        
        const lastOrders = orders.slice(-5).reverse();
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;

        // 2. Productos en Catálogo (Dato Real)
        const products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const totalProducts = products.length;

        // 3. Métricas del Chatbot (Dato Real de la sesión actual)
        const currentChatHistory = JSON.parse(sessionStorage.getItem('chatbot_history')) || [];
        const totalChatInteractions = currentChatHistory.length;

        // 4. Actualizar el DOM (Busca elementos por ID)
        this.updateCard('metric-revenue', `$${totalRevenue.toLocaleString()}`);
        
        this.updateCard('metric-orders', totalOrders);
        
        this.updateCard('metric-visitors', totalProducts);
        
        this.updateCard('metric-chatbot', totalChatInteractions);

        // 5. Actualizar la tabla de últimas órdenes
        this.updateOrderTable(lastOrders);

        // 6. Actualizar Gráfico
        this.updateChart(orders);
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
                <td>$${order.total.toLocaleString()}</td>
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
        orders.forEach(order => {
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
                    backgroundColor: '#D90429',
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
        document.getElementById('edit-sizes').value = '';
        document.getElementById('edit-image').value = '';
        document.getElementById('edit-section').value = isDrop ? 'new_drops' : 'ropa';
        
        // Usar la primera categoría disponible por defecto
        const cats = this.getCategories();
        document.getElementById('edit-category').value = cats.length > 0 ? cats[0].id : '';
        
        document.getElementById('edit-gender').value = 'unisex';
        document.getElementById('edit-description').value = '';
        
        // Cambiar título del modal
        document.querySelector('#edit-product-modal h2').textContent = isDrop ? 'Nuevo Drop' : 'Nuevo Producto';
        document.getElementById('edit-product-modal').classList.add('active');
    }

    openEditModal(id) {
        const products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const product = products.find(p => p.id === id);

        if (!product) return;

        document.querySelector('#edit-product-modal h2').textContent = 'Editar Producto';
        // Llenar formulario
        document.getElementById('edit-id').value = product.id;
        document.getElementById('edit-name').value = product.name;
        document.getElementById('edit-price').value = product.price;
        document.getElementById('edit-sizes').value = product.sizes ? product.sizes.join(', ') : '';
        document.getElementById('edit-image').value = product.image;
        
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
    }

    saveProductChanges() {
        const idVal = document.getElementById('edit-id').value;
        const products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
        const section = document.getElementById('edit-section').value;

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

        if (idVal) {
            // MODO EDICIÓN (Existe ID)
            const id = parseInt(idVal);
            const index = products.findIndex(p => p.id === id);
            if (index !== -1) {
            // Actualizar datos
            products[index].name = document.getElementById('edit-name').value;
            products[index].price = parseInt(document.getElementById('edit-price').value);
            products[index].image = document.getElementById('edit-image').value;
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
            const newProduct = {
                id: Date.now(), // Generar ID único basado en tiempo
                name: document.getElementById('edit-name').value,
                price: parseInt(document.getElementById('edit-price').value) || 0,
                image: document.getElementById('edit-image').value || 'https://via.placeholder.com/300',
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
        localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
        this.loadProducts();
        document.getElementById('edit-product-modal').classList.remove('active');
        
        alert(idVal ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    }

    deleteProduct(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
            let products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
            products = products.filter(p => p.id !== id);
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            this.loadProducts();
        }
    }
}

// Inicializar el gestor del panel
new ControlCenterManager();