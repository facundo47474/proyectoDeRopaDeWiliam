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

        // --- SOPORTE TÁCTIL (MOBILE) ---
        socialContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            // No prevenimos default aquí para permitir scroll vertical si no se arrastra horizontalmente
        }, { passive: true });

        window.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                previousRotation = currentRotation;
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const x = e.touches[0].clientX;
            const diff = x - startX;
            currentRotation = previousRotation + (diff * 0.3);
            slider.style.setProperty('--rot', `${currentRotation}deg`);
        }, { passive: true });
        
        // Animación de entrada de los paneles laterales
        const panels = document.querySelectorAll('.side-panel');
        const videos = socialContainer.querySelectorAll('video');
        const toggles = socialContainer.querySelectorAll('.social-sound-toggle');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    panels.forEach(panel => panel.classList.add('visible'));
                } else {
                    panels.forEach(panel => panel.classList.remove('visible'));
                    // Silenciar videos al salir de la sección
                    videos.forEach((v, i) => {
                        v.muted = true;
                        if (toggles[i]) {
                            toggles[i].innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                        }
                    });
                }
            });
        }, { threshold: 0.2 });

        observer.observe(socialContainer);

        // Lógica de Audio Exclusivo (Solo un video suena a la vez)
        toggles.forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el click interfiera con el drag del contenedor
                const currentVideo = videos[index];
                
                // Si está silenciado, lo activamos y silenciamos el resto
                if (currentVideo.muted) {
                    videos.forEach((v, i) => {
                        v.muted = true;
                        if (toggles[i]) {
                            toggles[i].innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                        }
                    });
                    currentVideo.muted = false;
                    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                } else {
                    // Si ya tiene sonido, solo lo silenciamos
                    currentVideo.muted = true;
                    btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
                }
            });
        });

        console.log("Lógica de Redes Sociales inicializada");
    }
}