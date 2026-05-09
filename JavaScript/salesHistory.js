document.addEventListener('DOMContentLoaded', initSalesHistoryPage);
document.addEventListener('firebase-ready', initSalesHistoryPage);

let allOrders = [];
let filtersBound = false;

async function initSalesHistoryPage() {
    // Cargar órdenes (preferir nube si está lista)
    let rawOrders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
    if (window.firebaseManager?.isInitialized) {
        const cloudOrders = await window.firebaseManager.getCollection('orders');
        if (cloudOrders !== null) {
            rawOrders = cloudOrders;
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(rawOrders));
            } catch (e) {
                console.warn("⚠️ LocalStorage lleno (History). Usando memoria RAM.");
            }
        }
    }

    allOrders = (rawOrders || []).filter(o => o.status === 'approved'); // Solo mostrar aprobadas
    
    // Renderizar inicial
    renderTable(allOrders);

    // Eventos de filtros (solo una vez)
    if (!filtersBound) {
        document.getElementById('apply-filters').addEventListener('click', applyFilters);
        document.getElementById('reset-filters').addEventListener('click', () => {
            document.getElementById('date-start').value = '';
            document.getElementById('date-end').value = '';
            renderTable(allOrders);
        });
        filtersBound = true;
    }
}

function renderTable(orders) {
    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';
    let totalRevenue = 0;

    // Ordenar: más recientes primero
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No se encontraron ventas.</td></tr>';
        document.getElementById('total-revenue').textContent = '$0';
        return;
    }

    orders.forEach(order => {
        totalRevenue += order.total;
        const date = new Date(order.date);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        const itemsCount = order.items ? order.items.reduce((acc, item) => acc + item.quantity, 0) : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight:bold; color:#fff;">#${order.id}</div>
                <div style="font-size:0.85rem; color:#888;">${formattedDate}</div>
            </td>
            <td>${order.customer || 'Cliente Web'}</td>
            <td>${itemsCount} productos</td>
            <td style="color: #D90429; font-weight: bold;">$${order.total.toLocaleString()}</td>
            <td>
                <button class="btn-details" onclick="openDetailModal(${order.id})">
                    <i class="fa-solid fa-eye"></i> Ver Detalle
                </button>
                <button class="btn-details" style="background: #e74c3c; border-color: #c0392b; margin-left: 5px;" onclick="deleteSale(${order.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
}

function applyFilters() {
    const startVal = document.getElementById('date-start').value;
    const endVal = document.getElementById('date-end').value;
    
    let filtered = [...allOrders];

    if (startVal) {
        const startDate = new Date(startVal);
        startDate.setHours(0,0,0,0);
        filtered = filtered.filter(o => new Date(o.date) >= startDate);
    }

    if (endVal) {
        const endDate = new Date(endVal);
        endDate.setHours(23,59,59,999);
        filtered = filtered.filter(o => new Date(o.date) <= endDate);
    }

    renderTable(filtered);
}

// Funciones globales para el modal
window.openDetailModal = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('modal-order-id').textContent = order.id;
    document.getElementById('modal-total').textContent = `$${order.total.toLocaleString()}`;
    
    const list = document.getElementById('modal-items-list');
    list.innerHTML = '';

    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'product-row';
            row.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid #333;';
            row.innerHTML = `
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div class="product-info" style="display: flex; flex-direction: column;">
                    <span style="color: #fff; font-weight: 600;">${item.quantity}x ${item.name}</span>
                    <span style="color:#888; font-size:0.9rem;">Talle: ${item.size || 'U'}</span>
                </div>
            `;
            list.appendChild(row);
        });
    } else {
        list.innerHTML = '<p>No hay detalles de productos disponibles.</p>';
    }

    document.getElementById('detail-modal').classList.add('active');
};

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.remove('active');
};

// Función para eliminar venta del historial (por error)
window.deleteSale = async function(id) {
    if(confirm('¿Estás seguro de eliminar este registro de venta? Se restará del total de ingresos.')) {
        let orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
        // Filtramos para quitar el ID seleccionado
        orders = orders.filter(o => o.id !== id);
        try {
            localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
        } catch (e) {
            console.warn("⚠️ No se pudo actualizar localStorage (Quota).");
        }

        if (window.firebaseManager?.isInitialized) {
            await window.firebaseManager.deleteOrder(id);
        }
        
        // Recargar página para actualizar tabla y array local
        location.reload();
    }
};
