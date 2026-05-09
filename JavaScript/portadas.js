/**
 * Lógica de la sección de Portadas
 * Maneja las animaciones de scroll y la reproducción de videos.
 */
function initPortadas() {
    // Lógica de Animación Scroll para Portadas
    const observerOptions = {
        threshold: 0.2 // Se activa cuando el 20% del elemento es visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Reproducir video si existe
                if (video) {
                    video.muted = true; // Asegurar silencio para permitir autoplay
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            // Ignorar errores de interrupción (AbortError) comunes al scrollear
                            if (e.name !== 'AbortError' && !e.message.includes('interrupted')) {
                                console.log("Autoplay bloqueado por el navegador:", e);
                            }
                        });
                    }
                }
            } else {
                
                entry.target.classList.remove('visible');
                
                if (video) {
                    video.pause();
                    video.currentTime = 0; 
                }
            }
        });
    }, observerOptions);

    const portadas = document.querySelectorAll('.portada-item');
    
    portadas.forEach(el => {
        
        const video = el.querySelector('video');
        const soundBtn = el.querySelector('.sound-toggle');
        
        if (video && soundBtn) {
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                video.muted = !video.muted;
                
                const icon = soundBtn.querySelector('i');
                icon.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            });
        }
        
        observer.observe(el);
    });
    
    console.log("Lógica de Portadas inicializada");
}