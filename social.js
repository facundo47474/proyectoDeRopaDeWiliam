/**
 * Lógica de la sección de Redes Sociales
 * Maneja la interacción 3D y el drag del carrusel de iconos.
 */
function initSocialMedia() {
    const socialContainer = document.querySelector('.social-3d-container');
    const slider = document.querySelector('.slider');

    if (socialContainer && slider) {
        let isDragging = false;
        let startX = 0;
        let currentRotation = 0;
        let previousRotation = 0;

        // Configurar cursor inicial
        socialContainer.style.cursor = 'grab';

        socialContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Solo permitir click izquierdo
            isDragging = true;
            startX = e.clientX;
            socialContainer.style.cursor = 'grabbing';
            e.preventDefault(); // Evitar selección de texto
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                socialContainer.style.cursor = 'grab';
                previousRotation = currentRotation;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const x = e.clientX;
            const diff = x - startX;
            // Sensibilidad del giro (0.3 para un control suave)
            currentRotation = previousRotation + (diff * 0.3);
            slider.style.setProperty('--rot', `${currentRotation}deg`);
        });
        
        // Animación de entrada de los paneles laterales
        const panels = document.querySelectorAll('.side-panel');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    panels.forEach(panel => panel.classList.add('visible'));
                } else {
                    panels.forEach(panel => panel.classList.remove('visible'));
                }
            });
        }, { threshold: 0.2 });

        observer.observe(socialContainer);

        console.log("Lógica de Redes Sociales inicializada");
    }
}