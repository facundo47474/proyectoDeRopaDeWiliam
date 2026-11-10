/**
 * GESTIÓN DE PEDIDOS, ENVÍOS Y TARIFAS (Integrado en Panel SPA)
 * Incluye utilidades compartidas (AdminOrderHelpers) para etiquetas y seguimiento.
 */

window.AdminOrderHelpers = {
    getPaymentBadgeHTML(order) {
        const esc = window.escaparHTML;
        if (order?.paymentMethod === 'mercadopago') {
            if (order.paymentStatus === 'paid' || order.status === 'approved') {
                const mpId = order.mpPaymentId ? ` #${esc(order.mpPaymentId)}` : '';
                return `<span class="order-pill pill-mp-paid"><i class="fa-solid fa-credit-card"></i> MP Pagado${mpId}</span>`;
            }
            if (order.paymentStatus === 'rejected' || order.paymentStatus === 'refunded') {
                const lbl = order.paymentStatus === 'refunded' ? 'Reembolsado' : 'Rechazado';
                return `<span class="order-pill pill-mp-rejected"><i class="fa-solid fa-circle-xmark"></i> MP ${lbl}</span>`;
            }
            return `<span class="order-pill pill-mp-pending"><i class="fa-solid fa-clock"></i> MP Pendiente</span>`;
        }
        return `<span class="order-pill pill-wa"><i class="fa-brands fa-whatsapp"></i> WhatsApp / Transf.</span>`;
    },

    getShippingBadgeHTML(order) {
        if (order?.shipping?.deliveryType === 'pickup') {
            return `<span class="order-pill pill-pickup"><i class="fa-solid fa-store"></i> Retira en Local</span>`;
        }
        if (order?.shippingStatus === 'shipped' || order?.shipping?.trackingCode) {
            return `<span class="order-pill pill-shipped"><i class="fa-solid fa-truck-fast"></i> Despachado</span>`;
        }
        return `<span class="order-pill pill-dispatch"><i class="fa-solid fa-box"></i> Por Despachar</span>`;
    },

    buildShippingBlockHTML(order) {
        const esc = window.escaparHTML;
        const fmt = window.formatearPrecio;
        const buyer = order?.buyer || {};
        const ship = order?.shipping || {};
        const nombre = buyer.fullName || order?.customer || 'Cliente Web';
        const dni = buyer.dni ? ` · DNI: <strong>${esc(buyer.dni)}</strong>` : '';
        const tel = buyer.phone ? ` · Tel: <strong>${esc(buyer.phone)}</strong>` : '';

        let envioHTML = '';
        if (ship.deliveryType === 'pickup') {
            envioHTML = `<div><i class="fa-solid fa-store"></i> <strong>Retira en Local</strong> (San Lorenzo 19, Apóstoles) · <strong>GRATIS</strong></div>`;
        } else if (ship.streetName || ship.city || ship.province) {
            const depto = ship.apartment ? ` (${esc(ship.apartment)})` : '';
            const costoTxt = Number(order.shippingCost || 0) === 0 ? 'GRATIS' : fmt(order.shippingCost);
            envioHTML = `
                <div><i class="fa-solid fa-location-dot"></i> ${esc(ship.streetName)} ${esc(ship.streetNumber)}${depto}</div>
                <div>${esc(ship.city)}${ship.province ? `, ${esc(ship.province)}` : ''}${ship.postalCode ? ` — CP <strong>${esc(ship.postalCode)}</strong>` : ''}</div>
                <div>${ship.zoneLabel ? `${esc(ship.zoneLabel)} · ` : ''}Envío: <strong>${costoTxt}</strong></div>
                ${ship.reference ? `<div style="color:#9E9E9E;">Ref: ${esc(ship.reference)}</div>` : ''}
            `;
        } else {
            envioHTML = `<div style="color:#888;"><i class="fa-solid fa-comment"></i> Entrega a coordinar con el cliente</div>`;
        }

        const trackingHTML = ship.trackingCode
            ? `<div class="order-tracking-line"><i class="fa-solid fa-barcode"></i> Seguimiento: ${esc(ship.carrier || 'Correo')}: ${esc(ship.trackingCode)}</div>`
            : '';

        return `
            <div class="order-shipping-box">
                <div><i class="fa-solid fa-user"></i> <strong>${esc(nombre)}</strong>${dni}${tel}</div>
                ${envioHTML}
                ${trackingHTML}
            </div>
        `;
    },

    formatShippingLabelText(order) {
        const buyer = order?.buyer || {};
        const ship = order?.shipping || {};
        const nombre = buyer.fullName || order?.customer || 'Cliente';
        const lines = [
            `DESTINATARIO: ${nombre}`,
            `DNI: ${buyer.dni || '-'} | TEL: ${buyer.phone || '-'}`
        ];

        if (ship.deliveryType === 'pickup') {
            lines.push('ENTREGA: Retiro en Local (San Lorenzo 19, Apóstoles)');
        } else {
            const depto = ship.apartment ? ` (${ship.apartment})` : '';
            lines.push(`DIRECCIÓN: ${ship.streetName || ''} ${ship.streetNumber || ''}${depto}`.trim());
            lines.push(`LOCALIDAD: ${ship.city || ''}, ${ship.province || ''} - CP: ${ship.postalCode || ''}`);
            if (ship.reference) lines.push(`REF: ${ship.reference}`);
        }
        lines.push(`ORDEN: #${order?.id || ''}`);
        return lines.join('\n');
    },

    async copyShippingLabel(order) {
        if (!order) return;
        const label = this.formatShippingLabelText(order);
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(label);
            } else {
                const ta = document.createElement('textarea');
                ta.value = label;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            window.adminToast?.('Etiqueta de envío copiada al portapapeles.');
        } catch (e) {
            window.adminToast?.('No se pudo copiar la etiqueta automáticamente.', true);
        }
    }
};

class GestorPedidosAdmin {
    constructor(panelAdmin) {
        this.panel = panelAdmin;
        this.orders = [];
        this.activeTab = 'pending'; // 'pending' | 'dispatch' | 'all'
        this.bindControls();
    }

    bindControls() {
        const refreshBtn = document.getElementById('btn-refresh-orders');
        if (refreshBtn && !refreshBtn.dataset.bound) {
            refreshBtn.dataset.bound = 'true';
            refreshBtn.addEventListener('click', () => this.loadOrders(true));
        }

        // Tabs de bandeja de pedidos
        document.querySelectorAll('[data-orders-tab]').forEach(btn => {
            if (btn.dataset.bound) return;
            btn.dataset.bound = 'true';
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.ordersTab || 'pending';
                document.querySelectorAll('[data-orders-tab]').forEach(b => b.classList.toggle('active', b === btn));
                this.renderCurrentView();
            });
        });

        // Configurador colapsable de tarifas de envío
        const shipPanel = document.getElementById('shipping-config-panel');
        document.getElementById('btn-toggle-shipping-config')?.addEventListener('click', () => {
            if (!shipPanel) return;
            const visible = shipPanel.style.display !== 'none';
            shipPanel.style.display = visible ? 'none' : 'block';
            if (!visible) this.loadShippingConfigForm();
        });
        document.getElementById('btn-close-shipping-config')?.addEventListener('click', () => {
            if (shipPanel) shipPanel.style.display = 'none';
        });
        document.getElementById('shipping-config-form')?.addEventListener('submit', (e) => this.saveShippingConfigForm(e));

        // Modal código de seguimiento
        const trackingModal = document.getElementById('tracking-modal');
        const closeTracking = () => trackingModal?.classList.remove('active');
        document.getElementById('close-tracking-x')?.addEventListener('click', closeTracking);
        document.getElementById('cancel-tracking')?.addEventListener('click', closeTracking);
        trackingModal?.addEventListener('click', (e) => {
            if (e.target === trackingModal) closeTracking();
        });
        document.getElementById('tracking-form')?.addEventListener('submit', (e) => this.submitTrackingForm(e));
    }

    async loadShippingConfigForm() {
        let cfg = typeof window.normalizarShippingConfig === 'function'
            ? window.normalizarShippingConfig(null)
            : null;
        if (window.firebaseManager && typeof window.firebaseManager.getShippingConfig === 'function') {
            cfg = await window.firebaseManager.getShippingConfig();
        }
        if (!cfg) return;

        const elFree = document.getElementById('ship-free-enabled');
        const elThreshold = document.getElementById('ship-free-threshold');
        const elCp = document.getElementById('ship-local-cp');
        const elLocal = document.getElementById('ship-rate-local');
        const elZ1 = document.getElementById('ship-rate-zone1');
        const elZ2 = document.getElementById('ship-rate-zone2');
        const elZ3 = document.getElementById('ship-rate-zone3');
        const elZ4 = document.getElementById('ship-rate-zone4');

        if (elFree) elFree.checked = cfg.freeShippingEnabled !== false;
        if (elThreshold) elThreshold.value = cfg.freeShippingThreshold;
        if (elCp) elCp.value = cfg.localPostalCode;
        if (elLocal) elLocal.value = cfg.rates.local;
        if (elZ1) elZ1.value = cfg.rates.zone1_nea_close;
        if (elZ2) elZ2.value = cfg.rates.zone2_litoral;
        if (elZ3) elZ3.value = cfg.rates.zone3_national;
        if (elZ4) elZ4.value = cfg.rates.zone4_patagonia;
    }

    async saveShippingConfigForm(e) {
        e.preventDefault();
        const cfg = {
            freeShippingEnabled: document.getElementById('ship-free-enabled')?.checked !== false,
            freeShippingThreshold: Number(document.getElementById('ship-free-threshold')?.value || 120000),
            localPostalCode: String(document.getElementById('ship-local-cp')?.value || '3350').replace(/\D/g, '') || '3350',
            rates: {
                local: Number(document.getElementById('ship-rate-local')?.value || 0),
                zone1_nea_close: Number(document.getElementById('ship-rate-zone1')?.value || 0),
                zone2_litoral: Number(document.getElementById('ship-rate-zone2')?.value || 0),
                zone3_national: Number(document.getElementById('ship-rate-zone3')?.value || 0),
                zone4_patagonia: Number(document.getElementById('ship-rate-zone4')?.value || 0)
            }
        };

        const btn = document.getElementById('btn-save-shipping-config');
        if (btn) btn.disabled = true;

        if (window.firebaseManager && typeof window.firebaseManager.saveShippingConfig === 'function') {
            const res = await window.firebaseManager.saveShippingConfig(cfg);
            if (res.ok) {
                window.adminToast?.('Tarifas de envío guardadas y sincronizadas.');
            } else {
                window.adminToast?.('Guardado localmente (sin conexión a nube).', true);
            }
        } else {
            localStorage.setItem('urbanHustlerShippingConfig', JSON.stringify(cfg));
            window.adminToast?.('Tarifas de envío actualizadas.');
        }

        if (btn) btn.disabled = false;
    }

    setOrders(orders) {
        this.orders = Array.isArray(orders) ? orders : [];
        this.renderCurrentView();
    }

    async loadOrders(forzarNube = false) {
        let orders = [];

        if (window.firebaseManager?.isInitialized) {
            const cloudOrders = await window.firebaseManager.getCollection('orders');
            if (cloudOrders !== null) {
                orders = cloudOrders;
                try {
                    localStorage.setItem('urbanHustlerOrders', JSON.stringify(orders));
                } catch (e) {}
            }
        }

        if (orders.length === 0 && !forzarNube) {
            try {
                orders = JSON.parse(localStorage.getItem('urbanHustlerOrders')) || [];
            } catch (e) {
                orders = [];
            }
        }

        this.setOrders(orders);
    }

    updateBadge(count) {
        const badge = document.getElementById('sidebar-orders-badge');
        if (!badge) return;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    getFilteredLists() {
        const sorted = [...(this.orders || [])]
            .filter(Boolean)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const pending = sorted.filter(o => o.status === 'pending');
        const dispatch = sorted.filter(o =>
            o.status === 'approved' &&
            o.shippingStatus !== 'shipped' &&
            !o.shipping?.trackingCode
        );

        return { sorted, pending, dispatch };
    }

    renderCurrentView() {
        const { sorted, pending, dispatch } = this.getFilteredLists();
        this.updateBadge(pending.length);

        const elP = document.getElementById('count-tab-pending');
        const elD = document.getElementById('count-tab-dispatch');
        const elA = document.getElementById('count-tab-all');
        if (elP) elP.textContent = pending.length;
        if (elD) elD.textContent = dispatch.length;
        if (elA) elA.textContent = sorted.length;

        const container = document.getElementById('orders-list');
        if (!container) return;

        let list = pending;
        if (this.activeTab === 'dispatch') list = dispatch;
        else if (this.activeTab === 'all') list = sorted;

        this.render(container, list);
    }

    render(container, ordersToRender) {
        container.innerHTML = '';

        if (!ordersToRender || ordersToRender.length === 0) {
            const msg = this.activeTab === 'dispatch'
                ? 'No hay envíos pagos pendientes de despacho.'
                : 'Todo al día. No hay pedidos en esta vista.';
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-circle-check"></i>
                    <p>${msg}</p>
                </div>
            `;
            return;
        }

        ordersToRender.forEach(order => {
            const date = new Date(order.date).toLocaleString();
            const itemsHtml = (order.items || []).map(i => {
                const imgSegura = window.escaparHTML(window.optimizeCloudinary(i.image, 100));
                const nombreSeguro = window.escaparHTML(i.name || 'Producto');
                const talleSeguro = window.escaparHTML(i.size || 'U');
                return `
                    <div class="order-item-row">
                        <img src="${imgSegura}" alt="${nombreSeguro}">
                        <div>
                            <div style="color: #F0F0F0; font-weight: 700; font-size: 0.86rem;">${Number(i.quantity || 1)}x ${nombreSeguro}</div>
                            <div style="color: #888; font-size: 0.76rem;">Talle: <strong style="color: #ccc;">${talleSeguro}</strong> · ${window.formatearPrecio(i.price)}</div>
                        </div>
                    </div>
                `;
            }).join('');

            const card = document.createElement('div');
            card.className = 'order-card';
            const idSeguro = window.escaparHTML(order.id);
            const clienteSeguro = window.escaparHTML(order.customer || order.buyer?.fullName || 'Cliente Web');
            const emailSeguro = order.email && order.email !== 'Concretado por WhatsApp'
                ? `<small style="color:#777;">${window.escaparHTML(order.email)}</small>`
                : '';

            const badgesHTML = `
                <div class="order-badges-row">
                    ${window.AdminOrderHelpers.getPaymentBadgeHTML(order)}
                    ${window.AdminOrderHelpers.getShippingBadgeHTML(order)}
                </div>
            `;
            const shippingHTML = window.AdminOrderHelpers.buildShippingBlockHTML(order);

            const isPending = order.status === 'pending';
            const hasAddress = order.shipping && (order.shipping.streetName || order.shipping.deliveryType);

            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <span class="order-id">#${idSeguro}</span>
                        <span class="order-customer">${clienteSeguro}</span>
                        ${emailSeguro}
                        ${badgesHTML}
                    </div>
                    <span class="order-date">${window.escaparHTML(date)}</span>
                </div>
                ${shippingHTML}
                <div class="order-items">${itemsHtml}</div>
                <div class="order-total-row">
                    <span>Total Pedido ${Number(order.shippingCost || 0) > 0 ? `(incl. envío ${window.formatearPrecio(order.shippingCost)})` : ''}</span>
                    <strong>${window.formatearPrecio(order.total)}</strong>
                </div>
                <div class="order-actions-wrap">
                    ${isPending ? `
                        <button type="button" class="btn-primary btn-action" data-id="${idSeguro}" data-action="confirm">
                            <i class="fa-solid fa-check"></i> Confirmar Venta
                        </button>
                    ` : ''}
                    ${hasAddress ? `
                        <button type="button" class="btn-secondary btn-sm btn-copy-label" data-id="${idSeguro}" title="Copiar etiqueta de correo">
                            <i class="fa-solid fa-copy"></i> Etiqueta
                        </button>
                        <button type="button" class="btn-secondary btn-sm btn-send-tracking" data-id="${idSeguro}" title="Cargar y enviar código de seguimiento">
                            <i class="fa-solid fa-truck-fast"></i> Seguimiento
                        </button>
                    ` : ''}
                    ${isPending ? `
                        <button type="button" class="btn-danger btn-sm btn-action" data-id="${idSeguro}" data-action="reject" title="Descartar pedido">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', () => {
                this.processOrder(btn.dataset.id, btn.dataset.action);
            });
        });

        container.querySelectorAll('.btn-copy-label').forEach(btn => {
            btn.addEventListener('click', () => {
                const ord = this.orders.find(o => String(o.id) === String(btn.dataset.id));
                window.AdminOrderHelpers.copyShippingLabel(ord);
            });
        });

        container.querySelectorAll('.btn-send-tracking').forEach(btn => {
            btn.addEventListener('click', () => this.openTrackingModal(btn.dataset.id));
        });
    }

    openTrackingModal(orderId, fallbackOrder = null) {
        const order = this.orders.find(o => String(o.id) === String(orderId)) || fallbackOrder;
        if (!order) return;

        document.getElementById('tracking-order-id').value = order.id;
        const phone = order.buyer?.phone || 'Sin teléfono';
        const name = order.buyer?.fullName || order.customer || 'Cliente';
        document.getElementById('tracking-order-summary').textContent =
            `Orden #${order.id} · ${name} (WhatsApp: ${phone})`;
        document.getElementById('tracking-carrier').value = order.shipping?.carrier || 'Correo Argentino';
        document.getElementById('tracking-code').value = order.shipping?.trackingCode || '';

        document.getElementById('tracking-modal')?.classList.add('active');
    }

    async submitTrackingForm(e) {
        e.preventDefault();
        const orderId = document.getElementById('tracking-order-id').value;
        const carrier = document.getElementById('tracking-carrier').value.trim() || 'Correo Argentino';
        const trackingCode = document.getElementById('tracking-code').value.trim();
        if (!orderId || !trackingCode) return;

        const idx = this.orders.findIndex(o => String(o.id) === String(orderId));
        if (idx === -1) return;

        const currentOrder = this.orders[idx];
        const updatedShipping = {
            ...(currentOrder.shipping || {}),
            carrier,
            trackingCode
        };

        const updatedOrder = {
            ...currentOrder,
            shippingStatus: 'shipped',
            shippedAt: new Date().toISOString(),
            shipping: updatedShipping
        };
        this.orders[idx] = updatedOrder;

        try {
            localStorage.setItem('urbanHustlerOrders', JSON.stringify(this.orders));
        } catch (err) {}

        if (window.firebaseManager?.isInitialized) {
            await window.firebaseManager.saveOrder(updatedOrder);
        }

        document.getElementById('tracking-modal')?.classList.remove('active');
        window.adminToast?.('Código de seguimiento guardado.');

        const rawPhone = String(currentOrder.buyer?.phone || '').replace(/\D/g, '');
        if (rawPhone) {
            const phoneWA = rawPhone.startsWith('54') ? rawPhone : `549${rawPhone.replace(/^0+/, '')}`;
            const nombre = currentOrder.buyer?.fullName || currentOrder.customer || '';
            const msg = `¡Hola ${nombre}! 📦 Tu pedido *#${currentOrder.id}* de UrbanHustler ya fue despachado por *${carrier}*.\n\n🔎 Tu código de seguimiento es: *${trackingCode}*\n\n¡Gracias por elegirnos!`;
            window.open(`https://wa.me/${phoneWA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
        }

        await this.panel?.refreshAllData();
    }

    async processOrder(id, action) {
        const index = this.orders.findIndex(o => String(o.id) === String(id));
        if (index === -1) return;

        if (action === 'confirm') {
            if (!confirm('¿Confirmar el pago de este pedido? Se sumará a las ventas y se descontará el stock si aún no fue descontado.')) return;

            const currentOrder = this.orders[index];
            const alreadyDeducted = currentOrder.stockDeducted === true;

            let products = [...(this.panel?.inventario?.allProducts || [])];
            if (products.length === 0) {
                try {
                    products = JSON.parse(localStorage.getItem('urbanHustlerProducts') || '[]');
                } catch (e) {
                    products = [];
                }
            }

            if (!alreadyDeducted) {
                products = products.map(p => ({ ...p, stock: p.stock !== undefined ? parseInt(p.stock, 10) : 5 }));
                for (const item of (currentOrder.items || [])) {
                    const productIdx = products.findIndex(p => String(p.id) === String(item.id));
                    if (productIdx !== -1) {
                        const qty = parseInt(item.quantity, 10) || 1;
                        products[productIdx].stock = Math.max(0, products[productIdx].stock - qty);
                        if (window.firebaseManager?.isInitialized) {
                            await window.firebaseManager.saveProduct(products[productIdx]);
                        }
                    }
                }
            }

            const order = {
                ...currentOrder,
                status: 'approved',
                paymentStatus: 'paid',
                stockDeducted: true,
                approvedAt: currentOrder.approvedAt || new Date().toISOString()
            };
            this.orders[index] = order;

            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(this.orders));
                localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            } catch (e) {}

            if (window.firebaseManager?.isInitialized) {
                await window.firebaseManager.saveOrder(order);
            }

            window.adminToast?.('Venta confirmada y stock actualizado.');
        } else if (action === 'reject') {
            if (!confirm('¿Descartar este pedido pendiente?')) return;

            this.orders.splice(index, 1);
            try {
                localStorage.setItem('urbanHustlerOrders', JSON.stringify(this.orders));
            } catch (e) {}

            if (window.firebaseManager?.isInitialized) {
                await window.firebaseManager.deleteOrder(id);
            }

            window.adminToast?.('Pedido descartado.');
        }

        await this.panel?.refreshAllData();
    }
}

window.GestorPedidosAdmin = GestorPedidosAdmin;
