function initFilters() {
    const sidebar = document.getElementById('filters-sidebar');
    const overlay = document.getElementById('overlay');

    // Cerrar menú
    function closeMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    if (overlay) overlay.addEventListener('click', closeMenu);

    // Reemplazar contenido del sidebar con el nuevo menú de secciones
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="filters-header" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
                <h2 style="margin: 0; font-size: 1.5rem; text-transform: uppercase;">Secciones</h2>
                <button id="close-filters-new" style="background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="filters-menu" style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <button class="filter-menu-item" data-filter="ropa" style="background: transparent; border: 1px solid #333; color: #fff; padding: 15px; text-align: left; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1rem; transition: all 0.3s;">
                    <i class="fa-solid fa-shirt" style="color: #D90429;"></i> Ropa (Todo)
                </button>
                <button class="filter-menu-item" data-filter="new_drops" style="background: transparent; border: 1px solid #333; color: #fff; padding: 15px; text-align: left; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1rem; transition: all 0.3s;">
                    <i class="fa-solid fa-fire" style="color: #D90429;"></i> New Drops
                </button>
                <button class="filter-menu-item" data-filter="combos" style="background: transparent; border: 1px solid #333; color: #fff; padding: 15px; text-align: left; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1rem; transition: all 0.3s;">
                    <i class="fa-solid fa-layer-group" style="color: #D90429;"></i> Combos
                </button>
                <button class="filter-menu-item" data-filter="ofertas" style="background: transparent; border: 1px solid #333; color: #fff; padding: 15px; text-align: left; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 1rem; transition: all 0.3s;">
                    <i class="fa-solid fa-tag" style="color: #D90429;"></i> Ofertas
                </button>
            </div>
            <div id="theme-toggle-wrapper" style="padding: 20px; border-top: 1px solid #333; margin-top: auto;"></div>
        `;

        // Evento cerrar
        document.getElementById('close-filters-new').addEventListener('click', closeMenu);

        // Eventos de menú
        sidebar.querySelectorAll('.filter-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = btn.dataset.filter;
                
                // Resetear filtros
                document.dispatchEvent(new CustomEvent('app:filter-change', { detail: { key: 'category', value: 'all' } }));
                document.dispatchEvent(new CustomEvent('app:filter-change', { detail: { key: 'isOffer', value: false } }));

                if (filter === 'new_drops') {
                    window.location.href = 'index.html#productos-container';
                } else if (filter === 'combos') {
                    document.dispatchEvent(new CustomEvent('app:filter-change', { detail: { key: 'category', value: 'combos' } }));
                } else if (filter === 'ofertas') {
                    document.dispatchEvent(new CustomEvent('app:filter-change', { detail: { key: 'isOffer', value: true } }));
                }
                
                closeMenu();
            });
        });
    }

    // --- Lógica de Modo Claro / Oscuro ---
    // Inyectar el interruptor en el sidebar
    const themeWrapper = document.getElementById('theme-toggle-wrapper');
    if (themeWrapper) {
        const themeContainer = document.createElement('div');
        themeContainer.className = 'theme-toggle-container';
        themeContainer.innerHTML = `
            <span class="toggle-label">Modo Claro</span>
            <label class="theme-switch">
                <input type="checkbox" id="theme-switch">
                <span class="theme-slider"></span>
            </label>
        `;
        themeWrapper.appendChild(themeContainer);

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