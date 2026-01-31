function initFilters() {
    const sidebar = document.getElementById('filters-sidebar');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('close-filters');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    const categoryInputs = document.querySelectorAll('input[name="category"]');

    // Cerrar menú
    function closeMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    // Lógica de Categorías
    categoryInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            // Desacoplamiento: Emitir evento en lugar de modificar globales
            document.dispatchEvent(new CustomEvent('app:filter-change', {
                detail: { key: 'category', value: e.target.value }
            }));
        });
    });

    // Lógica de Precio
    priceRange.addEventListener('input', (e) => {
        const val = e.target.value;
        priceValue.textContent = val;
        document.dispatchEvent(new CustomEvent('app:filter-change', {
            detail: { key: 'maxPrice', value: parseInt(val) }
        }));
    });

    // --- Lógica de Modo Claro / Oscuro ---
    // Inyectar el interruptor en el sidebar
    if (sidebar) {
        const themeContainer = document.createElement('div');
        themeContainer.className = 'theme-toggle-container';
        themeContainer.innerHTML = `
            <span class="toggle-label">Modo Claro</span>
            <label class="theme-switch">
                <input type="checkbox" id="theme-switch">
                <span class="theme-slider"></span>
            </label>
        `;
        sidebar.appendChild(themeContainer);

        const themeSwitch = document.getElementById('theme-switch');

        // Cargar preferencia guardada
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-mode');
            if (themeSwitch) themeSwitch.checked = true;
        }

        themeSwitch?.addEventListener('change', (e) => {
            document.body.classList.toggle('light-mode', e.target.checked);
            localStorage.setItem('theme', e.target.checked ? 'light' : 'dark');
        });
    }
}