// Detectar si el DOM ya está cargado (importante para carga dinámica)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderPendingOrders());
} else {
    renderPendingOrders();
}
// Cuando Firebase termine de inicializar, refrescamos desde la nube
document.addEventListener('firebase-ready', () => renderPendingOrders(true));

async function renderPendingOrders(forceCloud = false) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    let orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];

    // Si está Firebase listo, traemos la data real y la cacheamos
    if (window.firebaseManager?.isInitialized && (forceCloud || !orders.length)) {
        const cloudOrders = await window.firebaseManager.getCollection('orders');
        if (cloudOrders !== null) {
            orders = cloudOrders;
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
            } catch (e) {
                console.warn("⚠️ LocalStorage lleno (Orders). Usando memoria RAM.");
            }
        }
    }

    const pendingOrders = orders.filter(o => o.status === 'pending').sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = '';

    if (pendingOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-check-circle" style="font-size: 3rem; margin-bottom: 20px; color: #333;"></i>
                <p>¡Todo al día! No hay pedidos pendientes de revisión.</p>
            </div>
        `;
        return;
    }

    pendingOrders.forEach(order => {
        const date = new Date(order.date).toLocaleString();
        const itemsHtml = order.items.map(i => `
            <div class="item-row" style="display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid #333;">
                <img src="${i.image}" alt="${i.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #444;">
                <div style="display: flex; flex-direction: column;">
                    <span style="color: #fff; font-weight: 600; font-size: 1rem;">${i.quantity}x ${i.name}</span>
                    <span style="color: #888; font-size: 0.9rem;">Talle: <strong style="color: #ccc;">${i.size || 'U'}</strong></span>
                </div>
            </div>
        `).join('');

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <span>#${order.id}</span>
                <span>${date}</span>
            </div>
            <div class="order-items">
                ${itemsHtml}
            </div>
            <div class="order-total">
                $${order.total.toLocaleString()}
            </div>
            <div class="actions">
                <button class="btn-action btn-confirm" onclick="processOrder(${order.id}, 'confirm')">
                    <i class="fa-solid fa-check"></i> Confirmar
                </button>
                <button class="btn-action btn-reject" onclick="processOrder(${order.id}, 'reject')">
                    <i class="fa-solid fa-trash"></i> Rechazar
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.processOrder = async function(id, action) {
    let orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
    const index = orders.findIndex(o => o.id === id);

    if (index === -1) return;

    if (action === 'confirm') {
        if (confirm('¿Confirmar que recibiste el pago de este pedido? Se sumará a las ventas.')) {
            const order = orders[index];
            order.status = 'approved';

            // --- LÓGICA DE DESCUENTO DE STOCK ---
            // 1. Obtener los productos actuales (priorizando la nube)
            let products = JSON.parse(localStorage.getItem('urbanHustlerProducts')) || [];
            if (window.firebaseManager?.isInitialized) {
                const cloudProducts = await window.firebaseManager.getCollection('products');
                if (cloudProducts) products = cloudProducts;
            }

            // 2. Normalizar stock (asegurar que todos tengan el valor por defecto de 5 si es undefined)
            products = products.map(p => ({ ...p, stock: (p.stock !== undefined) ? parseInt(p.stock) : 5 }));

            // 3. Recorrer los items del pedido y descontar cantidades
            for (const item of order.items) {
                const productIdx = products.findIndex(p => String(p.id) === String(item.id));
                if (productIdx !== -1) {
                    const quantityToSubtract = parseInt(item.quantity) || 1;
                    products[productIdx].stock = Math.max(0, products[productIdx].stock - quantityToSubtract);
                    
                    // 4. Actualizar producto individual en Firebase inmediatamente
                    if (window.firebaseManager?.isInitialized) {
                        await window.firebaseManager.saveProduct(products[productIdx]);
                    }
                }
            }

            // 5. Guardar cambios locales de pedidos y productos
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
                localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            } catch (e) {
                console.warn("⚠️ No se pudo actualizar localStorage (Quota).");
            }

            // 6. Persistir la orden aprobada en la nube
            if (window.firebaseManager?.isInitialized) {
                await window.firebaseManager.saveOrder(order);
            }
            
            renderPendingOrders();
        }
    } else if (action === 'reject') {
        if (confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) {
            // Eliminar del array
            orders.splice(index, 1);
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
            } catch (e) {
                console.warn("⚠️ No se pudo actualizar localStorage (Quota).");
            }
            // Borrar en nube
            if (window.firebaseManager?.isInitialized) {
                await window.firebaseManager.deleteOrder(id);
            }
            renderPendingOrders();
        }
    }
};
