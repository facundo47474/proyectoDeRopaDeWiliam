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
            window.currentCategory = e.target.value;
            window.applyFilters(); // Función global en catalogo.js
        });
    });

    // Lógica de Precio
    priceRange.addEventListener('input', (e) => {
        const val = e.target.value;
        priceValue.textContent = val;
        window.maxPrice = parseInt(val);
        window.applyFilters();
    });
}