/**
 * Lógica de la sección de Productos
 */
function initProductos() {
    // Animación simple de entrada al hacer scroll
    const cards = document.querySelectorAll('.product-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Pequeño retardo escalonado para cada tarjeta
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        // Estado inicial para animación JS (opcional, si se quiere controlar por JS)
        // card.style.opacity = '0';
        // card.style.transform = 'translateY(50px)';
        // observer.observe(card);
    });

    console.log("Lógica de Productos inicializada");
}