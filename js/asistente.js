/**
 * ASISTENTE VIRTUAL GUIADO (Solo opciones predefinidas, sin escritura libre)
 */
class ChatbotManager {
    constructor() {
        this.isOpen = false;
        this.idleTimer = null;
        this.helpRejected = sessionStorage.getItem('chatbot_help_rejected') === 'true';
        try {
            this.chatHistory = JSON.parse(sessionStorage.getItem('chatbot_history')) || [];
            if (!Array.isArray(this.chatHistory)) this.chatHistory = [];
        } catch (e) {
            this.chatHistory = [];
        }

        this.menuOptions = Array.isArray(window.CHATBOT_MENU) ? window.CHATBOT_MENU : [];
        this.init();
    }

    async init() {
        if (this.menuOptions.length === 0) {
            await this.loadKnowledgeBase();
            if (Array.isArray(window.CHATBOT_MENU)) {
                this.menuOptions = window.CHATBOT_MENU;
            }
        }

        this.injectHTML();
        this.cacheDOM();
        this.renderOptionsCatalog();
        this.bindEvents();
        this.loadHistory();
        this.checkLoginGreeting();
        this.startIdleTimer();
    }

    loadKnowledgeBase() {
        return new Promise((resolve) => {
            if (document.querySelector('script[src*="asistente-respuestas.js"]')) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = '/js/asistente-respuestas.js';
            script.onload = resolve;
            script.onerror = resolve;
            document.body.appendChild(script);
        });
    }

    injectHTML() {
        if (document.getElementById('chatbot-widget')) return;
        const html = `
            <div id="chatbot-widget">
                <div class="chatbot-window" role="dialog" aria-label="Asistente de UrbanHustler">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <img src="/recursos/imagenes/logo.jpeg" alt="UrbanHustler">
                            <span>AYUDA RÁPIDA</span>
                        </div>
                        <div class="chatbot-header-actions">
                            <button id="chatbot-reset" type="button" title="Reiniciar conversación" aria-label="Reiniciar conversación">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                            <button id="chatbot-close" type="button" aria-label="Cerrar asistente">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="message bot">
                            <p>¡Hola! Seleccioná una opción de abajo para resolver tu consulta al instante.</p>
                        </div>
                    </div>
                    <div class="chatbot-options-panel" id="chatbot-options-panel">
                        <div class="chatbot-options-label">SELECCIONÁ UN TEMA</div>
                        <div class="chatbot-options-grid" id="chatbot-options-grid"></div>
                    </div>
                </div>
                <div class="chatbot-cloud-message" id="chatbot-cloud">
                    <button class="chatbot-cloud-close" id="chatbot-cloud-close" aria-label="Cerrar aviso"><i class="fa-solid fa-xmark"></i></button>
                    <p>¿Tenés dudas sobre envíos, talles o pagos? Tocá aquí.</p>
                </div>
                <button id="chatbot-toggle" aria-label="Abrir asistente de ayuda">
                    <img src="/recursos/imagenes/logo.jpeg" alt="Asistente Virtual">
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
        this.resetBtn = document.getElementById('chatbot-reset');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.optionsGrid = document.getElementById('chatbot-options-grid');
        this.cloudMessage = document.getElementById('chatbot-cloud');
        this.cloudCloseBtn = document.getElementById('chatbot-cloud-close');
    }

    renderOptionsCatalog() {
        if (!this.optionsGrid) return;
        this.optionsGrid.innerHTML = '';

        this.menuOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chatbot-option-btn';
            const iconClass = opt.icon.includes(' ') ? opt.icon : `fa-solid ${opt.icon}`;
            btn.innerHTML = `<i class="${window.escaparHTML(iconClass)}"></i><span>${window.escaparHTML(opt.label)}</span>`;
            btn.addEventListener('click', () => this.handleOptionSelect(opt));
            this.optionsGrid.appendChild(btn);
        });
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat());
        this.resetBtn?.addEventListener('click', () => this.resetChat());

        this.cloudCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideCloudMessage();
            this.helpRejected = true;
            sessionStorage.setItem('chatbot_help_rejected', 'true');
        });

        this.cloudMessage.addEventListener('click', () => {
            this.hideCloudMessage();
            this.toggleChat();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('active', this.isOpen);

        if (this.isOpen) {
            this.hideCloudMessage();
            if (this.idleTimer) clearTimeout(this.idleTimer);
            this.scrollToBottom();
        }
    }

    resetChat() {
        this.chatHistory = [];
        sessionStorage.removeItem('chatbot_history');
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = `
                <div class="message bot">
                    <p>¡Hola! Seleccioná una opción de abajo para resolver tu consulta al instante.</p>
                </div>
            `;
        }
    }

    checkLoginGreeting() {
        const greeting = sessionStorage.getItem('login_greeting');
        if (greeting) {
            const p = this.cloudMessage.querySelector('p');
            if (p) p.innerHTML = greeting;
            this.cloudMessage.classList.add('visible');
            this.addMessage(greeting, 'bot', null, true);
            sessionStorage.removeItem('login_greeting');
        }
    }

    startIdleTimer() {
        if (this.helpRejected) return;
        this.idleTimer = setTimeout(() => {
            if (!this.isOpen && !this.helpRejected) {
                this.cloudMessage.classList.add('visible');
            }
        }, 240000);
    }

    hideCloudMessage() {
        this.cloudMessage.classList.remove('visible');
    }

    handleOptionSelect(option) {
        if (!option) return;
        this.addMessage(option.label, 'user', null, false);

        setTimeout(() => {
            this.addMessage(option.answer, 'bot', option.action || null, false);
        }, 220);
    }

    addMessage(text, sender, action = null, allowTrustedHtml = false, save = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        const p = document.createElement('p');
        if (allowTrustedHtml) {
            p.innerHTML = text;
        } else {
            p.style.whiteSpace = 'pre-line';
            p.textContent = text;
        }
        msgDiv.appendChild(p);

        if (action && action.href && action.label) {
            const link = document.createElement('a');
            link.className = 'chatbot-msg-action';
            link.href = action.href;
            link.textContent = action.label;
            if (action.external) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else {
                link.addEventListener('click', () => {
                    if (this.isOpen) this.toggleChat();
                });
            }
            msgDiv.appendChild(link);
        }

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();

        if (save) {
            this.chatHistory.push({ text, sender, action, trusted: allowTrustedHtml });
            sessionStorage.setItem('chatbot_history', JSON.stringify(this.chatHistory));
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    loadHistory() {
        if (this.chatHistory.length > 0) {
            this.messagesContainer.innerHTML = '';
            this.chatHistory.forEach(msg => {
                this.addMessage(
                    msg.text,
                    msg.sender === 'user' ? 'user' : 'bot',
                    msg.action || null,
                    Boolean(msg.trusted),
                    false
                );
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ChatbotManager());
} else {
    new ChatbotManager();
}
