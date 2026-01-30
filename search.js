function initSearch() {
    const searchInput = document.getElementById('global-search');
    const filterBtn = document.getElementById('filter-toggle-btn');
    
    // Evento de búsqueda en tiempo real
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        window.filterProducts(term); // Función global definida en catalogo.js
    });

    // Abrir menú de filtros
    filterBtn.addEventListener('click', () => {
        document.getElementById('filters-sidebar').classList.add('open');
        document.querySelector('.overlay').classList.add('active');
    });
}