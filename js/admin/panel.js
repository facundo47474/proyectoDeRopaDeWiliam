/**
 * PANEL DE CONTROL PRINCIPAL (SPA Unificada)
 * Coordina métricas, productos, pedidos pendientes, historial de ventas y clientes.
 */

window.adminToast = function (message, isError = false) {
    const container = document.getElementById('admin-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `
        <i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
        <span>${window.escaparHTML(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.25s ease';
        setTimeout(() => toast.remove(), 260);
    }, 3200);
};

class PanelControlAdmin {
    constructor() {
        this.inventario = null;
        this.pedidos = null;
        this.ventas = null;
        this.salesChart = null;
        this.allUsers = [];
        this.init();
    }

    init() {
        if (!window.verificarAccesoAdmin || !window.verificarAccesoAdmin()) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }

        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            this.refreshAllData();
        } else {
            document.addEventListener('firebase-ready', () => this.refreshAllData());
        }
    }

    async start() {
        this.setupNavigation();
        this.setupQuickCards();
        this.setupChartFilter();
        this.setupUserSearch();

        document.getElementById('btn-refresh-dashboard')?.addEventListener('click', async () => {
            await this.refreshAllData();
            window.adminToast('Datos actualizados.');
        });

        this.inventario = new window.GestorInventarioAdmin(this);
        this.pedidos = new window.GestorPedidosAdmin(this);
        this.ventas = new window.GestorVentasAdmin(this);

        await this.inventario.init();
        await this.refreshAllData();

        this.applyInitialHashRoute();
        window.addEventListener('hashchange', () => this.applyInitialHashRoute());
    }

    async refreshAllData() {
        if (this.inventario) await this.inventario.loadProducts();
        await this.loadOrdersAndSales();
        await this.loadUsers();
    }

    navigateToView(targetId) {
        const views = document.querySelectorAll('.admin-view');
        const allLinks = document.querySelectorAll('.admin-sidebar .admin-nav-link[data-target]');

        allLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-target') === targetId));
        views.forEach(view => {
            view.style.display = view.id === targetId ? 'block' : 'none';
        });

        document.querySelector('.admin-sidebar')?.classList.remove('active');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
    }

    applyInitialHashRoute() {
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const routeMap = {
            resumen: 'view-metrics',
            productos: 'view-products',
            pedidos: 'view-orders',
            ventas: 'view-sales',
            clientes: 'view-users'
        };
        if (routeMap[hash]) {
            this.navigateToView(routeMap[hash]);
        }
    }

    setupNavigation() {
        document.querySelectorAll('.admin-sidebar .admin-nav-link[data-target]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                const route = link.getAttribute('data-route');
                if (route) history.replaceState(null, '', `#${route}`);
                this.navigateToView(targetId);
            });
        });

        document.querySelectorAll('[data-jump]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-jump');
                this.navigateToView(targetId);
            });
        });
    }

    setupQuickCards() {
        document.getElementById('card-revenue')?.addEventListener('click', () => {
            history.replaceState(null, '', '#ventas');
            this.navigateToView('view-sales');
        });
        document.getElementById('card-orders')?.addEventListener('click', () => {
            history.replaceState(null, '', '#pedidos');
            this.navigateToView('view-orders');
        });
        document.getElementById('card-products')?.addEventListener('click', () => {
            this.inventario?.setStockFilter('all');
            history.replaceState(null, '', '#productos');
            this.navigateToView('view-products');
        });
        document.getElementById('card-low-stock')?.addEventListener('click', () => {
            this.inventario?.setStockFilter('low');
            history.replaceState(null, '', '#productos');
            this.navigateToView('view-products');
        });
    }

    setupChartFilter() {
        document.getElementById('chart-filter')?.addEventListener('change', () => {
            this.loadOrdersAndSales();
        });
    }

    setupUserSearch() {
        document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            const filtered = term
                ? this.allUsers.filter(u => (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term))
                : this.allUsers;
            this.renderUsersTable(filtered);
        });
    }

    updateProductsMetrics(products) {
        const list = products || [];
        const activeCount = list.filter(p => p.hidden !== true).length;
        const lowStockCount = list.filter(p => Number(p.stock) < 3).length;

        const elProd = document.getElementById('metric-products');
        const elProdSub = document.getElementById('metric-products-sub');
        const elLow = document.getElementById('metric-low-stock');

        if (elProd) elProd.textContent = list.length;
        if (elProdSub) elProdSub.textContent = `${activeCount} visibles en tienda`;
        if (elLow) elLow.textContent = lowStockCount;
    }

    async loadOrdersAndSales() {
        let orders = null;
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            orders = await window.firebaseManager.getCollection('orders');
        }

        if (orders !== null) {
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
            } catch (e) {}
        } else {
            try {
                orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
            } catch (e) {
                orders = [];
            }
        }

        const approvedOrders = orders.filter(o => o && o.status === 'approved');
        const pendingOrders = orders.filter(o => o && o.status === 'pending');

        const lastOrders = [...approvedOrders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        const totalRevenue = approvedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        const elRev = document.getElementById('metric-revenue');
        const elRevSub = document.getElementById('metric-revenue-sub');
        const elOrd = document.getElementById('metric-orders');

        if (elRev) elRev.textContent = window.formatearPrecio(totalRevenue);
        if (elRevSub) elRevSub.textContent = `${approvedOrders.length} ventas confirmadas`;
        if (elOrd) elOrd.textContent = pendingOrders.length;

        this.updateLatestOrdersTable(lastOrders);
        this.updateChart(approvedOrders);

        if (this.pedidos) {
            this.pedidos.setOrders(orders);
        }

        if (this.ventas) {
            this.ventas.setOrders(orders);
        }
    }

    updateLatestOrdersTable(orders) {
        const tableBody = document.getElementById('latest-orders-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 28px; color: #888;">Aún no hay ventas confirmadas.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const idSeguro = window.escaparHTML(order.id);
            const clienteSeguro = window.escaparHTML(order.customer || 'Cliente');
            const cant = order.itemsCount || (order.items ? order.items.reduce((a, i) => a + Number(i.quantity || 1), 0) : 0);

            row.innerHTML = `
                <td data-label="ID" style="font-family:var(--font-price); font-weight:700;">#${idSeguro}</td>
                <td data-label="Fecha" style="color:#9E9E9E;">${new Date(order.date).toLocaleDateString()}</td>
                <td data-label="Cliente">${clienteSeguro}</td>
                <td data-label="Prendas">${cant} u.</td>
                <td data-label="Total" style="font-family:var(--font-price); font-weight:700; color:#2ecc71;">${window.formatearPrecio(order.total)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateChart(orders) {
        const ctx = document.getElementById('salesChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const filterValue = document.getElementById('chart-filter')?.value || 'all';
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const categoryStats = {};

        orders.forEach(order => {
            let includeOrder = true;
            const orderDate = new Date(order.date);

            if (filterValue === 'today') {
                includeOrder = orderDate >= startOfToday;
            } else if (filterValue === '7days') {
                const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
                includeOrder = diffDays <= 7;
            } else if (filterValue === '30days') {
                const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
                includeOrder = diffDays <= 30;
            }

            if (includeOrder && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const cat = (item.category || 'Otros').toUpperCase();
                    categoryStats[cat] = (categoryStats[cat] || 0) + (Number(item.price || 0) * Number(item.quantity || 1));
                });
            }
        });

        const labels = Object.keys(categoryStats);
        const data = Object.values(categoryStats);

        if (this.salesChart) {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['SIN VENTAS EN EL PERÍODO'],
                datasets: [{
                    label: 'Ingresos ($)',
                    data: data.length ? data : [0],
                    backgroundColor: '#F0F0F0',
                    hoverBackgroundColor: '#2ecc71',
                    borderRadius: 0,
                    maxBarThickness: 56
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9E9E9E', font: { family: 'Archivo', weight: '700', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.06)' },
                        ticks: {
                            color: '#9E9E9E',
                            callback: (val) => '$' + Number(val).toLocaleString('es-AR')
                        }
                    }
                }
            }
        });
    }

    async loadUsers() {
        let users = null;
        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            users = await window.firebaseManager.getCollection('users');
        }

        if (users !== null) {
            try {
                localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));
            } catch (e) {}
        } else {
            try {
                users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
            } catch (e) {
                users = [];
            }
        }

        this.allUsers = (users || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderUsersTable(this.allUsers);
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 30px; color: #888;">No hay clientes registrados aún.</td></tr>';
            return;
        }

        users.forEach(user => {
            const nombreSeguro = window.escaparHTML(user.name || 'Usuario');
            const emailSeguro = window.escaparHTML(user.email || '-');
            const fotoSegura = user.picture
                ? `<img src="${window.escaparHTML(user.picture)}" alt="" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">`
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Fecha" style="color:#9E9E9E;">${new Date(user.date).toLocaleDateString()}</td>
                <td data-label="Cliente" class="cell-primary">
                    <div style="display:flex; align-items:center; gap:10px; font-weight:600; color:#F0F0F0;">
                        ${fotoSegura}
                        <span>${nombreSeguro}</span>
                    </div>
                </td>
                <td data-label="Correo" style="color:#CCCCCC; word-break:break-word;">${emailSeguro}</td>
                <td data-label="Origen"><span class="status-pill pill-google"><i class="fa-brands fa-google" style="margin-right:5px;"></i> Google</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

new PanelControlAdmin();
