function initNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            if (input.value) {
                alert(`¡Bienvenido al club! Hemos enviado un correo de confirmación a ${input.value}`);
                form.reset();
            }
        });
    }
    console.log("Lógica de Newsletter inicializada");
}