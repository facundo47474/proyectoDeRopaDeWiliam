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
}