function initNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const email = input.value.trim();
            
            if (email) {
                // Guardar usuario en localStorage para el panel de control
                const users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
                const existing = users.find(u => u.email === email);
                
                if (!existing) {
                    users.push({
                        email: email,
                        name: 'Suscriptor',
                        source: 'newsletter',
                        date: new Date().toISOString()
                    });
                    localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));
                }

                alert(`¡Bienvenido al club! Hemos enviado un correo de confirmación a ${email}`);
                form.reset();
            }
        });
    }
    console.log("Lógica de Newsletter inicializada");
}