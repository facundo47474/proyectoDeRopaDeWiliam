/**
 * Lógica del Carrusel
 * Se encarga de rotar las imágenes y manejar los botones.
 */
function initCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-btn.next');
    const prevButton = document.querySelector('.carousel-btn.prev');
    let currentIndex = 0;

    // Función para mover el slide
    const moveToSlide = (index) => {
        // Ocultar todos
        slides.forEach(slide => slide.classList.remove('active'));
        // Mostrar el actual
        slides[index].classList.add('active');
    };

    // Event Listeners
    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        moveToSlide(currentIndex);
    });

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        moveToSlide(currentIndex);
    });

    // Auto-play cada 5 segundos
    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        moveToSlide(currentIndex);
    }, 5000);

    console.log("Carrusel inicializado");
}