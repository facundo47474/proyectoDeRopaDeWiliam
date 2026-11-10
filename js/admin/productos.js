/**
 * GESTIÓN DE PRODUCTOS Y CATEGORÍAS (Módulo del Panel Administrativo)
 */
class GestorInventarioAdmin {
    constructor(panelAdmin) {
        this.panel = panelAdmin;
        this.allProducts = [];
        this.categories = window.NEGOCIO?.categoriasBase || [];
        this.filters = { search: '', category: 'all', stock: 'all' };
    }

    async init() {
        await this.initCategoriesManager();
        this.initProductsManager();
        this.initFilterControls();
        this.initSizeChips();
        await this.loadProducts();
    }

    initFilterControls() {
        const searchInput = document.getElementById('admin-product-search');
        const catFilter = document.getElementById('admin-category-filter');
        const stockFilter = document.getElementById('admin-stock-filter');

        searchInput?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.trim().toLowerCase();
            this.applyProductFilters();
        });

        catFilter?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyProductFilters();
        });

        stockFilter?.addEventListener('change', (e) => {
            this.filters.stock = e.target.value;
            this.applyProductFilters();
        });
    }

    setStockFilter(val) {
        this.filters.stock = val;
        const stockFilter = document.getElementById('admin-stock-filter');
        if (stockFilter) stockFilter.value = val;
        this.applyProductFilters();
    }

    async initCategoriesManager() {
        if (window.firebaseManager && typeof window.firebaseManager.getCategories === 'function') {
            this.categories = await window.firebaseManager.getCategories();
        } else {
            try {
                const stored = JSON.parse(localStorage.getItem('urbanHustlerCategories'));
                if (Array.isArray(stored) && stored.length > 0) this.categories = stored;
            } catch (e) {}
        }

        const manageBtn = document.getElementById('btn-manage-categories');
        const modal = document.getElementById('manage-categories-modal');
        const closeBtn = document.getElementById('close-categories-modal');
        const closeX = document.getElementById('close-categories-x');
        const addBtn = document.getElementById('btn-add-category');
        const input = document.getElementById('new-category-input');

        const closeModal = () => {
            modal?.classList.remove('active');
            this.populateCategorySelects();
        };

        if (manageBtn && !manageBtn.dataset.bound) {
            manageBtn.dataset.bound = 'true';
            manageBtn.addEventListener('click', () => {
                this.renderCategoriesList();
                modal?.classList.add('active');
            });
        }

        [closeBtn, closeX].forEach(btn => {
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = 'true';
                btn.addEventListener('click', closeModal);
            }
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        if (addBtn && input && !addBtn.dataset.bound) {
            addBtn.dataset.bound = 'true';
            const agregar = () => {
                const val = input.value.trim();
                if (val) {
                    this.addCategory(val);
                    input.value = '';
                }
            };
            addBtn.addEventListener('click', agregar);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    agregar();
                }
            });
        }

        this.populateCategorySelects();
    }

    getCategories() {
        return this.categories;
    }

    async syncCategories() {
        try {
            localStorage.setItem('urbanHustlerCategories', JSON.stringify(this.categories));
        } catch (e) {}
        if (window.firebaseManager && typeof window.firebaseManager.saveCategories === 'function') {
            const res = await window.firebaseManager.saveCategories(this.categories);
            if (res && !res.ok) {
                window.adminToast?.('Guardado localmente, pero falló la sincronización de categorías en Firebase.', true);
            }
        }
    }

    async addCategory(name) {
        const id = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        if (!id) return;

        if (this.categories.find(c => c.id === id)) {
            window.adminToast?.('Esta categoría ya existe.', true);
            return;
        }

        this.categories.push({ id, name });
        await this.syncCategories();
        this.renderCategoriesList();
        this.populateCategorySelects();
        window.adminToast?.(`Categoría "${name}" agregada.`);
    }

    async deleteCategory(id) {
        if (id === 'all' || id === 'ver_todo') {
            window.adminToast?.('Esta categoría base no se puede eliminar.', true);
            return;
        }

        const productsUsingCategory = (this.allProducts || []).filter(p => p.category === id);
        if (productsUsingCategory.length > 0) {
            const productNames = productsUsingCategory.map(p => `- ${p.name}`).join('\n');
            alert(`No se puede eliminar esta categoría porque está asignada a:\n\n${productNames}`);
            return;
        }

        if (confirm('¿Eliminar esta categoría?')) {
            this.categories = this.categories.filter(c => c.id !== id);
            await this.syncCategories();
            this.renderCategoriesList();
            this.populateCategorySelects();
            window.adminToast?.('Categoría eliminada.');
        }
    }

    renderCategoriesList() {
        const list = document.getElementById('categories-list');
        if (!list) return;
        list.innerHTML = '';

        this.categories.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${window.escaparHTML(c.name)} <small style="color:#777; margin-left:6px;">(${window.escaparHTML(c.id)})</small></span>
                <button type="button" class="btn-danger btn-sm delete-cat-btn" data-id="${window.escaparHTML(c.id)}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            list.appendChild(li);
        });

        list.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catId = e.target.closest('button')?.dataset.id;
                if (catId) this.deleteCategory(catId);
            });
        });
    }

    populateCategorySelects() {
        const selectModal = document.getElementById('edit-category');
        const selectFilter = document.getElementById('admin-category-filter');

        if (selectModal) {
            const currentVal = selectModal.value;
            selectModal.innerHTML = '';
            this.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                selectModal.appendChild(opt);
            });
            if (this.categories.find(c => c.id === currentVal)) selectModal.value = currentVal;
        }

        if (selectFilter) {
            const currentFilter = selectFilter.value || 'all';
            selectFilter.innerHTML = '<option value="all">Todas las categorías</option>';
            this.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                selectFilter.appendChild(opt);
            });
            selectFilter.value = currentFilter;
        }
    }

    initSizeChips() {
        const container = document.getElementById('size-chips-container');
        const input = document.getElementById('edit-sizes');
        if (!container || !input) return;

        container.querySelectorAll('.size-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                this.syncSizesInputFromChips();
            });
        });

        input.addEventListener('input', () => {
            this.syncChipsFromSizesInput();
        });
    }

    syncSizesInputFromChips() {
        const container = document.getElementById('size-chips-container');
        const input = document.getElementById('edit-sizes');
        if (!container || !input) return;

        const selectedFromChips = Array.from(container.querySelectorAll('.size-chip.selected'))
            .map(b => b.dataset.size);
        const chipSet = new Set(Array.from(container.querySelectorAll('.size-chip')).map(b => b.dataset.size.toUpperCase()));
        const customSizes = input.value.split(',').map(s => s.trim()).filter(s => s && !chipSet.has(s.toUpperCase()));

        input.value = [...selectedFromChips, ...customSizes].join(', ');
    }

    syncChipsFromSizesInput() {
        const container = document.getElementById('size-chips-container');
        const input = document.getElementById('edit-sizes');
        if (!container || !input) return;

        const currentSizes = input.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        container.querySelectorAll('.size-chip').forEach(btn => {
            btn.classList.toggle('selected', currentSizes.includes(btn.dataset.size.toUpperCase()));
        });
    }

    initProductsManager() {
        const modal = document.getElementById('edit-product-modal');
        const cancelBtn = document.getElementById('cancel-edit');
        const closeX = document.getElementById('close-edit-x');
        const form = document.getElementById('edit-product-form');
        const addBtn = document.getElementById('btn-add-product');
        const addImgBtn = document.getElementById('btn-add-image-field');

        const closeModal = () => modal?.classList.remove('active');

        [cancelBtn, closeX].forEach(btn => {
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = 'true';
                btn.addEventListener('click', closeModal);
            }
        });

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        if (form && !form.dataset.bound) {
            form.dataset.bound = 'true';
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProductChanges();
            });
        }

        if (addBtn && !addBtn.dataset.bound) {
            addBtn.dataset.bound = 'true';
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        if (addImgBtn && !addImgBtn.dataset.bound) {
            addImgBtn.dataset.bound = 'true';
            addImgBtn.addEventListener('click', () => this.addImageInput(''));
        }
    }

    async loadProducts() {
        let products = [];

        if (window.firebaseManager && window.firebaseManager.isInitialized) {
            const cloudProducts = await window.firebaseManager.getCollection('products');
            if (cloudProducts !== null) {
                products = cloudProducts;
                try {
                    localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
                } catch (e) {}
            }
        }

        if (products.length === 0) {
            try {
                const stored = JSON.parse(localStorage.getItem('urbanHustlerProducts'));
                if (Array.isArray(stored)) products = stored;
            } catch (e) {}
        }

        products = products.map(p => ({
            ...p,
            stock: p.stock !== undefined ? parseInt(p.stock, 10) : 5
        }));

        this.allProducts = products;
        this.applyProductFilters();

        if (this.panel && typeof this.panel.updateProductsMetrics === 'function') {
            this.panel.updateProductsMetrics(products);
        }
    }

    applyProductFilters() {
        let filtered = [...(this.allProducts || [])];

        if (this.filters.search) {
            filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(this.filters.search));
        }
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.filters.category);
        }
        if (this.filters.stock === 'low') {
            filtered = filtered.filter(p => Number(p.stock) > 0 && Number(p.stock) < 3);
        } else if (this.filters.stock === 'out') {
            filtered = filtered.filter(p => Number(p.stock) <= 0);
        } else if (this.filters.stock === 'offer') {
            filtered = filtered.filter(p => p.isOffer === true);
        } else if (this.filters.stock === 'hidden') {
            filtered = filtered.filter(p => p.hidden === true);
        }

        this.renderProductsTable(filtered);
    }

    getCategoryLabel(catId) {
        const found = this.categories.find(c => c.id === catId);
        return found ? found.name : (catId || 'General');
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 36px; color: #888;">No hay prendas que coincidan con la búsqueda.</td></tr>';
            return;
        }

        products.forEach(product => {
            const isCloud = product.image && product.image.startsWith('http');
            const syncLabel = isCloud ? 'Nube' : 'Local';
            const stockNum = Number(product.stock);
            const stockClass = stockNum <= 0 ? 'out' : (stockNum < 3 ? 'low' : 'ok');

            const tr = document.createElement('tr');
            const idEsc = window.escaparHTML(product.id);
            const imgSegura = window.escaparHTML(window.optimizeCloudinary(product.image, 120));
            const nombreSeguro = window.escaparHTML(product.name);
            const tallesSeguros = window.escaparHTML(product.sizes ? product.sizes.join(', ') : '-');
            const catLabel = window.escaparHTML(this.getCategoryLabel(product.category));
            const urlTienda = window.obtenerUrlProducto(product);

            const badgesHtml = [
                product.hidden ? '<span class="status-pill pill-hidden">Oculto</span>' : '<span class="status-pill pill-active">Activo</span>',
                product.isOffer ? '<span class="status-pill pill-sale" style="margin-left:4px;">SALE</span>' : ''
            ].join('');

            tr.innerHTML = `
                <td data-label="Prenda" class="cell-primary">
                    <div class="table-product-cell">
                        <img src="${imgSegura}" alt="${nombreSeguro}">
                        <div>
                            <span class="product-name-text">${nombreSeguro}</span>
                            <span class="product-sync-badge">${syncLabel}</span>
                        </div>
                    </div>
                </td>
                <td data-label="Categoría">${catLabel}</td>
                <td data-label="Precio" style="font-family:var(--font-price); font-weight:700;">${window.formatearPrecio(product.price)}</td>
                <td data-label="Talles" style="color:#9E9E9E; font-size:0.78rem;">${tallesSeguros}</td>
                <td data-label="Stock">
                    <div class="inline-stock-control">
                        <button type="button" class="inline-stock-btn stock-dec-btn" data-id="${idEsc}" title="Restar 1">-</button>
                        <span class="inline-stock-val ${stockClass}">${stockNum}</span>
                        <button type="button" class="inline-stock-btn stock-inc-btn" data-id="${idEsc}" title="Sumar 1">+</button>
                    </div>
                </td>
                <td data-label="Estado">${badgesHtml}</td>
                <td data-label="Acciones" class="cell-actions">
                    <div class="table-actions-cell">
                        <a href="${urlTienda}" target="_blank" class="btn-secondary btn-sm" title="Ver en tienda"><i class="fa-solid fa-eye"></i></a>
                        <button type="button" class="btn-secondary btn-sm toggle-vis-btn" data-id="${idEsc}" title="${product.hidden ? 'Mostrar en tienda' : 'Ocultar de la tienda'}">
                            <i class="fa-solid ${product.hidden ? 'fa-eye-slash' : 'fa-toggle-on'}"></i>
                        </button>
                        <button type="button" class="btn-primary btn-sm edit-btn" data-id="${idEsc}" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-danger btn-sm delete-btn" data-id="${idEsc}" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.stock-dec-btn').forEach(btn => {
            btn.addEventListener('click', () => this.adjustStockInline(btn.dataset.id, -1));
        });
        tbody.querySelectorAll('.stock-inc-btn').forEach(btn => {
            btn.addEventListener('click', () => this.adjustStockInline(btn.dataset.id, 1));
        });
        tbody.querySelectorAll('.toggle-vis-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleVisibility(btn.dataset.id));
        });
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteProduct(btn.dataset.id));
        });
    }

    async adjustStockInline(id, delta) {
        const index = this.allProducts.findIndex(p => String(p.id) === String(id));
        if (index === -1) return;

        const nuevoStock = Math.max(0, Number(this.allProducts[index].stock || 0) + delta);
        this.allProducts[index].stock = nuevoStock;

        try {
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(this.allProducts));
        } catch (e) {}

        this.applyProductFilters();
        this.panel?.updateProductsMetrics?.(this.allProducts);

        if (window.firebaseManager?.isInitialized) {
            const res = await window.firebaseManager.saveProduct(this.allProducts[index]);
            if (res && !res.ok) {
                window.adminToast?.('Error actualizando stock en la nube.', true);
                return;
            }
        }
        window.adminToast?.(`Stock actualizado: ${this.allProducts[index].name} (${nuevoStock} u.)`);
    }

    async toggleVisibility(id) {
        const index = this.allProducts.findIndex(p => String(p.id) === String(id));
        if (index === -1) return;

        this.allProducts[index].hidden = !this.allProducts[index].hidden;
        try {
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(this.allProducts));
        } catch (e) {}

        this.applyProductFilters();
        this.panel?.updateProductsMetrics?.(this.allProducts);

        if (window.firebaseManager?.isInitialized) {
            await window.firebaseManager.saveProduct(this.allProducts[index]);
        }
        const estado = this.allProducts[index].hidden ? 'ocultado de la tienda' : 'visible en la tienda';
        window.adminToast?.(`${this.allProducts[index].name} ${estado}.`);
    }

    openAddModal() {
        document.getElementById('edit-id').value = '';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-price').value = '';
        document.getElementById('edit-stock').value = '5';
        document.getElementById('edit-sizes').value = 'S, M, L, XL';
        this.syncChipsFromSizesInput();

        const cats = this.getCategories();
        document.getElementById('edit-category').value = cats.length > 0 ? cats[0].id : '';
        document.getElementById('edit-gender').value = 'unisex';
        document.getElementById('edit-is-offer').checked = false;
        document.getElementById('edit-is-visible').checked = true;
        document.getElementById('edit-description').value = '';

        document.getElementById('product-modal-title').textContent = 'Nueva Prenda';
        document.getElementById('edit-product-modal').classList.add('active');

        const container = document.getElementById('images-list-container');
        if (container) {
            container.innerHTML = '';
            this.addImageInput('');
            this.addImageInput('');
        }
    }

    openEditModal(id) {
        const product = (this.allProducts || []).find(p => String(p.id) === String(id));
        if (!product) return;

        document.getElementById('product-modal-title').textContent = 'Editar Prenda';
        document.getElementById('edit-id').value = product.id;
        document.getElementById('edit-name').value = product.name || '';
        document.getElementById('edit-price').value = product.price || 0;
        document.getElementById('edit-stock').value = product.stock !== undefined ? product.stock : 5;
        document.getElementById('edit-sizes').value = product.sizes ? product.sizes.join(', ') : '';
        this.syncChipsFromSizesInput();

        const cats = this.getCategories();
        const catExists = cats.find(c => c.id === product.category);
        document.getElementById('edit-category').value = catExists ? product.category : (cats[0]?.id || '');
        document.getElementById('edit-gender').value = product.gender || 'unisex';
        document.getElementById('edit-is-offer').checked = Boolean(product.isOffer);
        document.getElementById('edit-is-visible').checked = product.hidden !== true;
        document.getElementById('edit-description').value = product.description || '';

        document.getElementById('edit-product-modal').classList.add('active');

        const container = document.getElementById('images-list-container');
        if (container) {
            container.innerHTML = '';
            const imagesToLoad = product.images && product.images.length > 0 ? product.images : [product.image];
            imagesToLoad.forEach(img => this.addImageInput(img || ''));
            if (imagesToLoad.length === 1) {
                this.addImageInput('');
            }
        }
    }

    async saveProductChanges() {
        const saveBtn = document.getElementById('btn-save-product');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Guardando...';
        }

        try {
            const idVal = document.getElementById('edit-id').value;
            const products = [...(this.allProducts || [])];
            const stockInput = document.getElementById('edit-stock');
            const parsedStock = stockInput && stockInput.value !== '' ? parseInt(stockInput.value, 10) : 5;

            const isOffer = Boolean(document.getElementById('edit-is-offer')?.checked);
            const isVisible = Boolean(document.getElementById('edit-is-visible')?.checked);
            const category = document.getElementById('edit-category').value;

            const imageInputs = document.querySelectorAll('.image-url-input');
            const images = Array.from(imageInputs).map(input => input.value.trim()).filter(Boolean);

            const rawName = document.getElementById('edit-name').value.trim();
            const slug = rawName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            const rawDescription = document.getElementById('edit-description').value.trim();
            const seoDescription = rawDescription || `Compra ${rawName} en UrbanHustler. Talles disponibles y envío a todo el país.`;
            const sizes = document.getElementById('edit-sizes').value.split(',').map(s => s.trim()).filter(Boolean);

            let productToSave = null;

            if (idVal) {
                const index = products.findIndex(p => String(p.id) === String(idVal));
                if (index !== -1) {
                    products[index] = {
                        ...products[index],
                        name: rawName,
                        price: parseInt(document.getElementById('edit-price').value, 10) || 0,
                        stock: parsedStock,
                        image: images[0] || products[index].image || '/recursos/imagenes/logo.jpeg',
                        images: images,
                        category: category,
                        gender: document.getElementById('edit-gender').value,
                        description: seoDescription,
                        slug: slug,
                        isOffer: isOffer,
                        hidden: !isVisible,
                        sizes: sizes.length > 0 ? sizes : ['U']
                    };
                    productToSave = products[index];
                }
            } else {
                productToSave = {
                    id: Date.now(),
                    name: rawName,
                    price: parseInt(document.getElementById('edit-price').value, 10) || 0,
                    stock: parsedStock,
                    image: images[0] || '/recursos/imagenes/logo.jpeg',
                    images: images,
                    category: category,
                    gender: document.getElementById('edit-gender').value,
                    sizes: sizes.length > 0 ? sizes : ['U'],
                    description: seoDescription,
                    slug: slug,
                    isOffer: isOffer,
                    hidden: !isVisible
                };
                products.push(productToSave);
            }

            this.allProducts = products;
            try {
                localStorage.setItem('urbanHustlerProducts', JSON.stringify(products));
            } catch (e) {}

            let cloudOk = true;
            if (window.firebaseManager && productToSave) {
                const res = await window.firebaseManager.saveProduct(productToSave);
                if (res && !res.ok) {
                    cloudOk = false;
                    window.adminToast?.(`Guardado local, pero falló Firebase: ${res.error}`, true);
                }
            }

            await this.loadProducts();
            document.getElementById('edit-product-modal').classList.remove('active');
            if (cloudOk) {
                window.adminToast?.(idVal ? 'Prenda actualizada correctamente.' : 'Prenda publicada correctamente.');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar Prenda';
            }
        }
    }

    async deleteProduct(id) {
        if (!confirm('¿Estás seguro de eliminar esta prenda del catálogo?')) return;

        this.allProducts = (this.allProducts || []).filter(p => String(p.id) !== String(id));
        try {
            localStorage.setItem('urbanHustlerProducts', JSON.stringify(this.allProducts));
        } catch (e) {}

        if (window.firebaseManager) {
            const res = await window.firebaseManager.deleteProduct(id);
            if (res && !res.ok) {
                window.adminToast?.('No se pudo eliminar en Firebase: ' + res.error, true);
            }
        }
        await this.loadProducts();
        window.adminToast?.('Prenda eliminada.');
    }

    addImageInput(value) {
        const container = document.getElementById('images-list-container');
        if (!container) return;

        const index = container.querySelectorAll('.image-input-wrapper').length + 1;
        const slotText = index === 1 ? 'Foto 1 (Principal)' : (index === 2 ? 'Foto 2 (Hover)' : `Foto ${index}`);

        const wrapper = document.createElement('div');
        wrapper.className = 'image-input-wrapper';

        const headerRow = document.createElement('div');
        headerRow.className = 'image-slot-label';
        headerRow.innerHTML = `<span>${slotText}</span>`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.title = 'Quitar foto';
        removeBtn.style.cssText = 'background:none; border:none; color:#9E9E9E; cursor:pointer; font-size:0.9rem;';
        headerRow.appendChild(removeBtn);

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-box';

        const imgPreview = document.createElement('img');
        imgPreview.style.display = 'none';

        const placeholderIcon = document.createElement('div');
        placeholderIcon.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.6rem; color: #555;"></i><p style="color: #666; margin: 4px 0 0; font-size: 0.72rem;">Subir foto</p>';
        placeholderIcon.style.cssText = 'text-align: center; display: flex; flex-direction: column; align-items: center;';

        if (value) {
            imgPreview.src = value;
            imgPreview.style.display = 'block';
            placeholderIcon.style.display = 'none';
        }

        previewContainer.appendChild(placeholderIcon);
        previewContainer.appendChild(imgPreview);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.cssText = 'width: 100%; color: #ccc; font-size: 0.72rem;';

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'O pegar URL...';
        urlInput.value = value || '';
        urlInput.className = 'image-url-input';
        urlInput.style.cssText = 'width: 100%; padding: 6px 8px; background: #141414; border: 1px solid #333; color: #fff; font-size: 0.75rem;';

        urlInput.addEventListener('input', () => {
            const val = urlInput.value.trim();
            if (val) {
                imgPreview.src = val;
                imgPreview.style.display = 'block';
                placeholderIcon.style.display = 'none';
            } else {
                imgPreview.style.display = 'none';
                placeholderIcon.style.display = 'flex';
            }
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            placeholderIcon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem; color: #F0F0F0;"></i><p style="color: #ccc; margin-top: 6px; font-size: 0.72rem;">Subiendo...</p>';
            imgPreview.style.display = 'none';
            placeholderIcon.style.display = 'flex';

            try {
                await this.loadCompressionLibrary();
                const compressedFile = await window.imageCompression(file, {
                    maxSizeMB: 2,
                    maxWidthOrHeight: 2048,
                    useWebWorker: true,
                    fileType: 'image/webp',
                    initialQuality: 0.9
                });

                const downloadURL = await this.uploadToCloudinary(compressedFile);
                if (downloadURL) {
                    imgPreview.src = downloadURL;
                    imgPreview.style.display = 'block';
                    placeholderIcon.style.display = 'none';
                    urlInput.value = downloadURL;
                    window.adminToast?.('Imagen subida a Cloudinary.');
                } else {
                    placeholderIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c;"></i><p style="font-size:0.72rem;">Error al subir</p>';
                }
            } catch (error) {
                console.error('Error procesando imagen:', error);
                placeholderIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: #e74c3c;"></i><p style="font-size:0.72rem;">Error</p>';
            }
        });

        removeBtn.onclick = () => {
            if (container.querySelectorAll('.image-input-wrapper').length > 1) {
                wrapper.remove();
            } else {
                fileInput.value = '';
                urlInput.value = '';
                imgPreview.src = '';
                imgPreview.style.display = 'none';
                placeholderIcon.style.display = 'flex';
            }
        };

        wrapper.appendChild(headerRow);
        wrapper.appendChild(previewContainer);
        wrapper.appendChild(fileInput);
        wrapper.appendChild(urlInput);
        container.appendChild(wrapper);
    }

    async uploadToCloudinary(file) {
        const cfg = window.NEGOCIO?.cloudinary || {
            cloudName: 'hurbanhustler',
            uploadPreset: 'urban_uploads',
            carpeta: 'urban_hustler_products'
        };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cfg.uploadPreset);
        formData.append('folder', cfg.carpeta);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) return data.secure_url;
            throw new Error(data.error?.message || 'Error en Cloudinary');
        } catch (error) {
            window.adminToast?.('Error al subir imagen: ' + error.message, true);
            return null;
        }
    }

    async loadCompressionLibrary() {
        if (window.imageCompression) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

window.GestorInventarioAdmin = GestorInventarioAdmin;
