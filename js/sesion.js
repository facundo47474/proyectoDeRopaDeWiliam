/**
 * GESTIÓN DE SESIÓN Y PERMISOS (Google Sign-In + Protección de Panel)
 */

function decodificarTokenJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

window.obtenerUsuarioActual = function () {
    const token = localStorage.getItem('user_token');
    const infoRaw = localStorage.getItem('user_info');
    if (!token || !infoRaw) return null;

    const payload = decodificarTokenJwt(token);
    // Verificar expiración del token JWT si tiene campo exp
    if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        return null;
    }

    try {
        return JSON.parse(infoRaw);
    } catch (e) {
        return null;
    }
};

window.esUsuarioAdministrador = function () {
    const usuario = window.obtenerUsuarioActual();
    const listaAdmins = window.NEGOCIO?.administradores || [];
    return Boolean(usuario && usuario.email && listaAdmins.includes(usuario.email));
};

window.verificarAccesoAdmin = function () {
    if (!window.esUsuarioAdministrador()) {
        document.body.innerHTML = `
            <div style="height:100vh;background:#0d0d0d;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;font-family:sans-serif;gap:16px;text-align:center;padding:20px;">
                <i class="fa-solid fa-lock" style="font-size:3rem;color:#D90429;"></i>
                <h1 style="font-size:1.8rem;margin:0;">Acceso Restringido</h1>
                <p style="color:#888;max-width:400px;">Inicia sesión con una cuenta de administrador autorizada para acceder al panel del negocio.</p>
                <a href="/index.html" style="padding:12px 24px;background:#2ecc71;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Volver a la Tienda</a>
            </div>
        `;
        return false;
    }
    return true;
};

window.iniciarSesionGoogle = function () {
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    renderizarContenedorLogin();

    let intentos = 0;
    const checkGoogle = setInterval(() => {
        intentos++;
        if (typeof google !== 'undefined' && google.accounts) {
            clearInterval(checkGoogle);
            if (!window.obtenerUsuarioActual()) {
                mostrarBotonGoogle();
            }
        } else if (intentos > 50) {
            clearInterval(checkGoogle);
        }
    }, 100);
};

function renderizarContenedorLogin() {
    const navIcons = document.querySelector('.nav-icons');
    if (!navIcons || document.getElementById('google-login-container')) return;

    const container = document.createElement('div');
    container.id = 'google-login-container';
    container.style.marginLeft = '20px';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.innerHTML = '<i class="fa-solid fa-user" style="font-size: 1.2rem; color: #fff; cursor: pointer;" title="Iniciar sesión"></i>';

    container.onclick = function () {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.prompt();
        }
    };

    navIcons.appendChild(container);

    const usuario = window.obtenerUsuarioActual();
    if (usuario) {
        mostrarEstadoLogueado(usuario);
    }
}

function mostrarBotonGoogle() {
    const container = document.getElementById('google-login-container');
    if (!container || window.location.protocol === 'file:') return;

    const clientId = window.NEGOCIO?.googleClientId || '543305563101-jdvoskcnplk9tguiqbgt2g68snd7mlk0.apps.googleusercontent.com';
    container.onclick = null;
    container.innerHTML = '';

    google.accounts.id.initialize({
        client_id: clientId,
        callback: manejarRespuestaCredencial
    });
    google.accounts.id.renderButton(container, {
        theme: 'filled_black',
        size: 'medium',
        shape: 'circle',
        type: 'icon'
    });
}

function manejarRespuestaCredencial(response) {
    const payload = decodificarTokenJwt(response.credential);
    if (!payload || !payload.email) return;

    localStorage.setItem('user_token', response.credential);
    localStorage.setItem('user_info', JSON.stringify(payload));

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('urbanHustlerUsers')) || [];
        if (!Array.isArray(users)) users = [];
    } catch (e) {
        users = [];
    }

    const userData = {
        email: payload.email,
        name: payload.name || 'Usuario Google',
        picture: payload.picture || '',
        source: 'google',
        date: new Date().toISOString()
    };

    const idx = users.findIndex(u => u.email === payload.email);
    if (idx > -1) {
        users[idx] = { ...users[idx], ...userData };
    } else {
        users.push(userData);
    }
    try {
        localStorage.setItem('urbanHustlerUsers', JSON.stringify(users));
    } catch (e) {}

    if (window.firebaseManager) {
        window.firebaseManager.signInWithGoogle(response.credential).then(() => {
            window.firebaseManager.saveUser(userData);
        });
    }

    if (window.esUsuarioAdministrador()) {
        sessionStorage.setItem(
            'login_greeting',
            `<strong style="font-size:1.05em; color:#fff;">Panel Administrativo Activo</strong><br><span style="color:#ccc;">Sesión iniciada con permisos de gestión.</span><br><a href="/admin/panel.html" class="chatbot-action-btn">Ir al Panel de Control <i class="fa-solid fa-arrow-right"></i></a>`
        );
    }

    mostrarEstadoLogueado(payload);
    location.reload();
}

function mostrarEstadoLogueado(user) {
    const container = document.getElementById('google-login-container');
    if (!container) return;

    const nombreSeguro = window.escaparHTML(user.name || 'Usuario');
    const fotoSegura = window.escaparHTML(user.picture || '/recursos/imagenes/logo.jpeg');
    const botonAdmin = window.esUsuarioAdministrador()
        ? `<a href="/admin/panel.html" title="Panel de Control" style="color:#2ecc71;margin-right:12px;font-size:1.1rem;"><i class="fa-solid fa-sliders"></i></a>`
        : '';

    container.innerHTML = `
        ${botonAdmin}
        <img src="${fotoSegura}" alt="${nombreSeguro}" title="Sesión: ${nombreSeguro} (Click para cerrar sesión)"
             style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;">
    `;
    const img = container.querySelector('img');
    if (img) {
        img.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar tu sesión?')) {
                localStorage.removeItem('user_token');
                localStorage.removeItem('user_info');
                location.reload();
            }
        });
    }
}

