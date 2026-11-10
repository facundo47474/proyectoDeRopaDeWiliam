/**
 * HISTORIAL DE VENTAS CONFIRMADAS (Integrado en Panel SPA)
 */
class GestorVentasAdmin {
    constructor(panelAdmin) {
        this.panel = panelAdmin;
        this.approvedOrders = [];
        this.currentModalOrder = null;
        this.bindControls();
    }

    bindControls() {
        document.getElementById('apply-filters')?.addEventListener('click', () => this.aplicarFiltrosFecha());

        document.getElementById('reset-filters')?.addEventListener('click', () => {
            document.getElementById('date-start').value = '';
            document.getElementById('date-end').value = '';
            document.querySelectorAll('.sales-preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === 'all'));
            this.render(this.approvedOrders);
        });

        document.querySelectorAll('.sales-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sales-preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aplicarPreset(btn.dataset.preset);
            });
        });

        const modal = document.getElementById('sale-detail-modal');
        const closeBtn = document.getElementById('close-sale-detail');
        const closeX = document.getElementById('close-sale-detail-x');
        const cerrar = () => modal?.classList.remove('active');

        closeBtn?.addEventListener('click', cerrar);
        closeX?.addEventListener('click', cerrar);
        modal?.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

        document.getElementById('btn-modal-copy-label')?.addEventListener('click', () => {
            if (this.currentModalOrder) {
                window.AdminOrderHelpers?.copyShippingLabel(this.currentModalOrder);
            }
        });

        document.getElementById('btn-modal-send-tracking')?.addEventListener('click', () => {
            if (this.currentModalOrder && this.panel?.pedidos) {
                cerrar();
                this.panel.pedidos.openTrackingModal(this.currentModalOrder.id, this.currentModalOrder);
            }
        });
    }

    setOrders(allOrders) {
        this.approvedOrders = (allOrders || [])
            .filter(o => o && o.status === 'approved')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const activePreset = document.querySelector('.sales-preset-btn.active')?.dataset.preset || 'all';
        this.aplicarPreset(activePreset);
    }

    aplicarPreset(preset) {
        const startEl = document.getElementById('date-start');
        const endEl = document.getElementById('date-end');
        const now = new Date();

        if (preset === 'all') {
            if (startEl) startEl.value = '';
            if (endEl) endEl.value = '';
            this.render(this.approvedOrders);
            return;
        }

        let startDate = new Date();
        if (preset === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (preset === '7days') {
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (preset === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        if (startEl) startEl.value = startDate.toISOString().split('T')[0];
        if (endEl) endEl.value = now.toISOString().split('T')[0];

        const filtered = this.approvedOrders.filter(o => new Date(o.date) >= startDate);
        this.render(filtered);
    }

    aplicarFiltrosFecha() {
        const startVal = document.getElementById('date-start')?.value;
        const endVal = document.getElementById('date-end')?.value;
        let filtered = [...this.approvedOrders];

        document.querySelectorAll('.sales-preset-btn').forEach(b => b.classList.remove('active'));

        if (startVal) {
            const startDate = new Date(startVal + 'T00:00:00');
            filtered = filtered.filter(o => new Date(o.date) >= startDate);
        }
        if (endVal) {
            const endDate = new Date(endVal + 'T23:59:59');
            filtered = filtered.filter(o => new Date(o.date) <= endDate);
        }

        this.render(filtered);
    }

    render(orders) {
        const tbody = document.getElementById('sales-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const ticketPromedio = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

        const elRev = document.getElementById('sales-period-revenue');
        const elCnt = document.getElementById('sales-period-count');
        const elTkt = document.getElementById('sales-period-ticket');
        if (elRev) elRev.textContent = window.formatearPrecio(totalRevenue);
        if (elCnt) elCnt.textContent = orders.length;
        if (elTkt) elTkt.textContent = window.formatearPrecio(ticketPromedio);

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 36px; color: #888;">No se encontraron ventas en este período.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const date = new Date(order.date);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const itemsCount = order.items ? order.items.reduce((acc, item) => acc + Number(item.quantity || 1), 0) : 0;
            const idSeguro = window.escaparHTML(order.id);
            const clienteSeguro = window.escaparHTML(order.customer || order.buyer?.fullName || 'Cliente Web');
            const badgesHTML = window.AdminOrderHelpers
                ? `<div class="order-badges-row">${window.AdminOrderHelpers.getPaymentBadgeHTML(order)}${window.AdminOrderHelpers.getShippingBadgeHTML(order)}</div>`
                : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Pedido / Fecha" class="cell-primary">
                    <div>
                        <div style="font-weight:700; font-family:var(--font-price);">#${idSeguro}</div>
                        <div style="font-size:0.78rem; color:#888;">${window.escaparHTML(formattedDate)}</div>
                        ${badgesHTML}
                    </div>
                </td>
                <td data-label="Cliente">${clienteSeguro}</td>
                <td data-label="Prendas">${itemsCount} prendas</td>
                <td data-label="Total" style="font-family:var(--font-price); font-weight:700; color:#2ecc71;">${window.formatearPrecio(order.total)}</td>
                <td data-label="Acciones" class="cell-actions">
                    <div class="table-actions-cell">
                        <button type="button" class="btn-secondary btn-sm btn-ver-detalle" data-id="${idSeguro}">
                            <i class="fa-solid fa-eye"></i> Detalle
                        </button>
                        <button type="button" class="btn-danger btn-sm btn-borrar-venta" data-id="${idSeguro}" title="Anular venta">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => this.openDetailModal(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-borrar-venta').forEach(btn => {
            btn.addEventListener('click', () => this.deleteSale(btn.dataset.id));
        });
    }

    openDetailModal(orderId) {
        const order = this.approvedOrders.find(o => String(o.id) === String(orderId));
        if (!order) return;
        this.currentModalOrder = order;

        document.getElementById('modal-order-id').textContent = order.id;
        document.getElementById('modal-order-customer').textContent = order.customer || order.buyer?.fullName || 'Cliente Web';
        document.getElementById('modal-order-date').textContent = new Date(order.date).toLocaleString();

        const elPayment = document.getElementById('modal-order-payment');
        if (elPayment) {
            elPayment.textContent = order.paymentMethod === 'mercadopago'
                ? `Mercado Pago${order.mpPaymentId ? ' #' + order.mpPaymentId : ''}`
                : 'WhatsApp / Transferencia';
        }

        const shipBox = document.getElementById('modal-order-shipping-box');
        if (shipBox && window.AdminOrderHelpers) {
            shipBox.innerHTML = window.AdminOrderHelpers.buildShippingBlockHTML(order);
        }

        const shippingCost = Number(order.shippingCost || 0);
        const subtotal = order.subtotal !== undefined
            ? Number(order.subtotal)
            : Math.max(0, Number(order.total || 0) - shippingCost);

        const elSub = document.getElementById('modal-subtotal');
        const elShip = document.getElementById('modal-shipping-cost');
        if (elSub) elSub.textContent = window.formatearPrecio(subtotal);
        if (elShip) elShip.textContent = shippingCost === 0 ? 'GRATIS ($0)' : window.formatearPrecio(shippingCost);
        document.getElementById('modal-total').textContent = window.formatearPrecio(order.total);

        const list = document.getElementById('modal-items-list');
        list.innerHTML = '';

        if (Array.isArray(order.items) && order.items.length > 0) {
            order.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'order-item-row';
                const imgSegura = window.escaparHTML(window.optimizeCloudinary(item.image, 100));
                row.innerHTML = `
                    <img src="${imgSegura}" alt="">
                    <div style="flex:1;">
                        <div style="color: #F0F0F0; font-weight: 700;">${Number(item.quantity || 1)}x ${window.escaparHTML(item.name)}</div>
                        <div style="color:#888; font-size:0.8rem;">Talle: ${window.escaparHTML(item.size || 'U')} · ${window.formatearPrecio(item.price)} c/u</div>
                    </div>
                `;
                list.appendChild(row);
            });
        } else {
            list.innerHTML = '<p style="color:#888; padding:12px 0;">Sin detalle de prendas.</p>';
        }

        document.getElementById('sale-detail-modal')?.classList.add('active');
    }

    async deleteSale(id) {
        const order = this.approvedOrders.find(o => String(o.id) === String(id));
        if (!order) return;

        if (!confirm('¿Anular y eliminar esta venta del historial? Se restará de tus ingresos totales.')) return;

        const devolverStock = confirm('¿Deseas devolver las prendas de esta venta al stock disponible?');
        if (devolverStock && Array.isArray(order.items)) {
            const products = [...(this.panel?.inventario?.allProducts || [])];
            for (const item of order.items) {
                const idx = products.findIndex(p => String(p.id) === String(item.id));
                if (idx !== -1) {
                    products[idx].stock = Number(products[idx].stock || 0) + (parseInt(item.quantity, 10) || 1);
                    if (window.firebaseManager?.isInitialized) {
                        await window.firebaseManager.saveProduct(products[idx]);
                    }
                }
            }
            try {
                localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            } catch (e) {}
        }

        let orders = JSON.parse(localStorage.getItem('urbanHustlerOrders') || '[]');
        orders = orders.filter(o => String(o.id) !== String(id));
        try {
            localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
        } catch (e) {}

        if (window.firebaseManager?.isInitialized) {
            await window.firebaseManager.deleteOrder(id);
        }

        window.adminToast?.(devolverStock ? 'Venta anulada y stock restaurado.' : 'Venta eliminada del historial.');
        await this.panel?.refreshAllData();
    }
}

window.GestorVentasAdmin = GestorVentasAdmin;
