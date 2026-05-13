/**
 * UrbanAI Chatbot Manager
 * Maneja la interfaz y lógica del asistente virtual.
 */
class ChatbotManager {
    constructor() {
        this.isOpen = false;
        this.idleTimer = null; // Timer para detectar inactividad
        this.userData = { name: null, age: null, location: null }; // Datos del usuario
        this.helpRejected = sessionStorage.getItem('chatbot_help_rejected') === 'true'; // Estado de rechazo
        this.chatHistory = JSON.parse(sessionStorage.getItem('chatbot_history')) || []; // Historial persistente
        
        // Cargar base de conocimientos externa o usar fallback mínimo
        this.responses = window.CHATBOT_DATA || {
            "hola": "¡Hola! 👋 Bienvenido a UrbanHustler. Estoy cargando mi base de datos...",
            "default": "Estoy actualizando mi sistema. Por favor, intenta de nuevo en unos segundos."
        };
        
        this.init();
    }

    init() {
        // Intentar cargar datos si no existen
        if (!window.CHATBOT_DATA) {
            this.loadKnowledgeBase().then(() => {
                this.responses = window.CHATBOT_DATA;
                console.log("🧠 Chatbot actualizado con datos externos.");
            });
        }

        this.injectHTML();
        this.cacheDOM();
        this.bindEvents();
        this.loadHistory(); // Restaurar conversación previa
        this.checkLoginGreeting();
        this.startIdleTimer(); // Iniciar contador de 4 minutos
    }

    loadKnowledgeBase() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = '/JavaScript/chatbotData.js';
            script.onload = resolve;
            script.onerror = () => console.warn("⚠️ No se pudo cargar chatbotData.js");
            document.body.appendChild(script);
        });
    }

    injectHTML() {
        const html = `
            <div id="chatbot-widget">
                <div class="chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <img src="https://i.postimg.cc/sgQg2xw0/logo.jpg" alt="AI">
                            <span>UrbanAI Assistant</span>
                        </div>
                        <button id="chatbot-close"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="message bot">
                            <p>¡Hola! 👋 Soy la IA de UrbanHustler. Estoy aquí para ayudarte a encontrar el mejor estilo. ¿Por qué no empiezas preguntándome por nuestras ofertas o calidad?</p>
                        </div>
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chatbot-input-field" placeholder="Escribe aquí..." autocomplete="off">
                        <button id="chatbot-send"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                <div class="chatbot-cloud-message" id="chatbot-cloud">
                    <button class="chatbot-cloud-close" id="chatbot-cloud-close"><i class="fa-solid fa-xmark"></i></button>
                    <p>Hey! 👋 Te veo observando... ¿Necesitas ayuda para encontrar tu estilo?</p>
                </div>
                <button id="chatbot-toggle" aria-label="Abrir chat de ayuda">
                    <img src="https://i.postimg.cc/sgQg2xw0/logo.jpg" alt="Asistente Virtual">
                </button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    cacheDOM() {
        this.widget = document.getElementById('chatbot-widget');
        this.window = this.widget.querySelector('.chatbot-window');
        this.toggleBtn = document.getElementById('chatbot-toggle');
        this.closeBtn = document.getElementById('chatbot-close');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.inputField = document.getElementById('chatbot-input-field');
        this.sendBtn = document.getElementById('chatbot-send');
        this.cloudMessage = document.getElementById('chatbot-cloud');
        this.cloudCloseBtn = document.getElementById('chatbot-cloud-close');
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat());
        
        // Eventos de la nube
        this.cloudCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar abrir el chat al cerrar la nube
            this.hideCloudMessage();
            this.helpRejected = true;
            sessionStorage.setItem('chatbot_help_rejected', 'true'); // Guardar preferencia
        });
        this.cloudMessage.addEventListener('click', () => {
            this.hideCloudMessage();
            this.toggleChat(); // Abrir chat al hacer click en la nube
        });

        this.sendBtn.addEventListener('click', () => this.handleUserMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('active', this.isOpen);
        
        if (this.isOpen) {
            setTimeout(() => this.inputField.focus(), 100);
            this.hideCloudMessage(); // Asegurar que la nube se oculte si abren el chat
            if (this.idleTimer) clearTimeout(this.idleTimer); // Cancelar timer si ya interactuó
        }
    }

    checkLoginGreeting() {
        const greeting = sessionStorage.getItem('login_greeting');
        if (greeting) {
            const p = this.cloudMessage.querySelector('p');
            if (p) p.innerHTML = greeting; // Usar innerHTML para respetar formato HTML
            this.cloudMessage.classList.add('visible');
            
            // Agregar también al historial del chat para que persista si se cierra la nube
            this.addMessage(greeting, 'bot');
            
            sessionStorage.removeItem('login_greeting');
        }
    }

    startIdleTimer() {
        if (this.helpRejected) return; // Si ya rechazó, no iniciamos timer

        // 4 minutos = 240000 ms
        this.idleTimer = setTimeout(() => {
            if (!this.isOpen && !this.helpRejected) {
                this.cloudMessage.classList.add('visible');
                // Sonido de notificación suave (opcional)
                // const audio = new Audio('../assets/notification.mp3'); audio.play().catch(e=>{});
            }
        }, 240000); 
    }

    hideCloudMessage() {
        this.cloudMessage.classList.remove('visible');
    }

    handleUserMessage() {
        const text = this.inputField.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.inputField.value = '';

        // Simular "escribiendo..."
        setTimeout(() => {
            const response = this.getBotResponse(text.toLowerCase());
            this.addMessage(response, 'bot');
        }, 600);
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = `<p>${text}</p>`;
        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Guardar en historial
        this.chatHistory.push({ text, sender });
        sessionStorage.setItem('chatbot_history', JSON.stringify(this.chatHistory));
    }

    detectUserData(input) {
        const lowerInput = input.toLowerCase();
        
        // 1. Detectar Ubicación
        const locMatch = lowerInput.match(/(?:vivo en|soy de|estoy en|vengo de) (.+)/i);
        if (locMatch && !lowerInput.includes("?")) {
            let location = locMatch[1].replace(/[.,!?;:]/g, '').trim();
            location = location.replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar
            this.userData.location = location;
            return `¡Mira vos! Saludos a toda la gente de ${location}. 🌍 Quedate tranquilo que hacemos envíos hasta allá.`;
        }

        // 2. Detectar Edad
        const ageMatch = lowerInput.match(/(?:tengo) (\d+) (?:años)/i);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            this.userData.age = age;
            if (age < 18) return `¡${age} años! Tienes toda la onda joven. 😎 Esta ropa es ideal para vos.`;
            if (age > 50) return `¡${age} años! La actitud no tiene edad. 🎩 Me encanta que elijas estilo urbano.`;
            return `¡${age} años! Estás en la mejor edad para definir tu estilo. 🔥`;
        }

        // 3. Detectar Nombre
        let name = null;
        const nameMatchExplicit = lowerInput.match(/(?:me llamo|mi nombre es) ([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
        
        if (nameMatchExplicit) {
            name = nameMatchExplicit[1];
        } else {
            // Buscar "soy [Nombre]" evitando palabras comunes
            const soyMatch = lowerInput.match(/\bsoy\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
            if (soyMatch) {
                const candidate = soyMatch[1];
                const forbidden = ["de", "un", "una", "el", "la", "nuevo", "nueva", "yo"];
                if (!forbidden.includes(candidate)) {
                    name = candidate;
                }
            }
        }

        if (name) {
            name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            this.userData.name = name;
            return `¡Un gusto, ${name}! 🤜🤛 Ya te tengo agendado. ¿Qué andás buscando hoy?`;
        }

        return null;
    }

    formatResponse(text) {
        const nameStr = this.userData.name ? ` ${this.userData.name}` : '';
        // Reemplazar {name} si existe, sino borrarlo
        return text.replace('{name}', nameStr);
    }

    getBotResponse(input) {
        // 0. Detectar datos personales primero
        const personalResponse = this.detectUserData(input);
        if (personalResponse) return personalResponse;

        // Normalizar entrada
        const lowerInput = input.toLowerCase();
        
        // Ordenar claves por longitud (descendente) para priorizar frases específicas
        // Ejemplo: "envio gratis" se detectará antes que "envio"
        const keys = Object.keys(this.responses).sort((a, b) => b.length - a.length);

        for (const key of keys) {
            if (key !== "default" && lowerInput.includes(key)) {
                return this.formatResponse(this.responses[key]);
            }
        }
        return this.formatResponse(this.responses["default"]);
    }

    loadHistory() {
        if (this.chatHistory.length > 0) {
            this.messagesContainer.innerHTML = ''; // Limpiar mensaje por defecto
            this.chatHistory.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.className = `message ${msg.sender}`;
                msgDiv.innerHTML = `<p>${msg.text}</p>`;
                this.messagesContainer.appendChild(msgDiv);
            });
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
}

// Inicializar automáticamente
// Usamos check de readyState para soportar carga dinámica desde navbar.js
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ChatbotManager();
    });
} else {
    new ChatbotManager();
}