function initNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('input');
            const email = input.value.trim().toLowerCase();
            
            // 1. VALIDACIÓN DE SINTAXIS (Estándar Industrial RFC 5322)
            const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            
            if (!emailRegex.test(email)) {
                alert("Formato de correo inválido. Por favor verifica.");
                return;
            }

            // 2. FILTRO DE DOMINIOS TEMPORALES (Anti-Spam)
            const disposableDomains = ['tempmail.com', 'throwawaymail.com', 'mailinator.com', '10minutemail.com', 'yopmail.com', 'guerrillamail.com'];
            const domain = email.split('@')[1];
            if (disposableDomains.includes(domain)) {
                alert("Por seguridad, no aceptamos correos temporales.");
                return;
            }

            // 3. VERIFICACIÓN DE EXISTENCIA (API Abstract)
            // Validamos usando la estructura JSON profesional (deliverability y quality)
            const apiKey = 'TU_API_KEY_ABSTRACT'; // <--- PEGA TU API KEY AQUÍ
            
            if (apiKey !== 'TU_API_KEY_ABSTRACT') {
                try {
                    const res = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
                    const data = await res.json();

                    // Verificamos si el correo es entregable (status: "deliverable")
                    if (data.email_deliverability && data.email_deliverability.status !== "deliverable") {
                        alert("El correo ingresado no existe o no puede recibir mensajes.");
                        return;
                    }

                    // Verificamos calidad y si es desechable (is_disposable: true)
                    if (data.email_quality && data.email_quality.is_disposable) {
                        alert("Por seguridad, no aceptamos correos temporales.");
                        return;
                    }
                } catch (err) {
                    console.warn("Error conectando con API de validación, permitiendo registro:", err);
                }
            }

            if (email) {
                // Guardar usuario en localStorage para el panel de control
                let users = [];
                try {
                    users = JSON.parse(localStorage.getItem('urbanHustlerUsers'));
                    if (!Array.isArray(users)) users = [];
                } catch (e) {
                    users = [];
                }

                const existing = users.find(u => u.email === email);
                
                if (!existing) {
                    const newUser = {
                        email: email,
                        name: 'Suscriptor',
                        source: 'newsletter',
                        date: new Date().toISOString(),
                        verified: false, // Double Opt-In: Pendiente de verificación
                        status: 'pending_confirmation'
                    };
                    users.push(newUser);
                    localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));
                    
                    // --- GUARDAR EN NUBE ---
                    if (window.firebaseManager) {
                        window.firebaseManager.saveUser(newUser);
                    }

                    alert(`¡Casi listo! Hemos enviado un enlace de confirmación a ${email}.`);
                } else {
                    alert("Este correo ya está suscrito.");
                }
                
                form.reset();
            }
        });
    }
    console.log("Lógica de Newsletter inicializada");
}