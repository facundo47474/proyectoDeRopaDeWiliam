/**
 * UrbanAI Chatbot Manager
 * Maneja la interfaz y lógica del asistente virtual.
 */
class ChatbotManager {
    constructor() {
        this.isOpen = false;
        this.idleTimer = null; // Timer para detectar inactividad
        this.userData = { name: null, age: null, location: null }; // Datos del usuario
        // Base de conocimientos simple
        this.responses = {
            // 🧍‍♂️ 1. Preguntas generales (primer contacto)
            "hola": "¡Hola{name}! 👋 Bienvenido a UrbanHustler. ¿En qué te puedo ayudar hoy? ¿Buscas algo para vos o para regalar?",
            "ayuda": "¡De una! 🤜🤛 Estoy acá para eso. Decime, ¿qué tenés en mente? ¿Algo para el día a día o para salir?",
            "tipo de ropa": "Hacemos Streetwear Premium. 💎 Hoodies, remeras oversize, cargos y accesorios con identidad propia.",
            "hombre": "Nuestra ropa no tiene etiquetas. Es unisex y el corte es urbano. Si te gusta, es para vos. 🔥",
            "mujer": "¡Claro! Muchas chicas usan nuestros hoodies y remeras oversize. El estilo no tiene género acá.",
            "unisex": "Exacto. La mayoría de nuestras prendas son sin género. Lo importante es el fit y cómo lo llevas.",
            "casual": "Es un estilo versátil. Sirve para estar chill en casa, para la facu o para salir a tomar algo. Vos le das la onda.",
            "deportiva": "Tenemos joggers y remeras cómodas que van re bien para entrenar o para un look sport-urbano.",
            "marca": "Trabajamos nuestra propia marca: UrbanHustler Originals. Diseño y producción nacional con estándares internacionales. 🇦🇷",
            "nacional": "100% Industria Argentina, pero con calidad de exportación. Apoyamos lo nuestro.",
            "stock": "Renovamos stock constantemente, pero las ediciones limitadas VUELAN. 🚀 Si ves algo, no duermas.",
            "local": "¡Sí! Tenemos showroom en Suipacha 282, Apóstoles. Vení a probarte todo.",
            "ubicacion": "Estamos en Apóstoles, Misiones. Calle Suipacha 282. ¡Te esperamos!",
            "atienden": "Abrimos de Lunes a Sábado de 09:30 a 12:30 y de 17:00 a 21:30hs.",
            "recomendar": "¡Me encanta esa pregunta! 😎 Si querés ir a lo seguro: un Hoodie Negro + Cargo. Si querés destacar: nuestras remeras con estampa en la espalda.",
            "primera vez": "¡Bienvenido a la familia! 🙌 Es fácil: elegís, agregás al carrito y te lo mandamos a tu casa. Tenés cambio garantizado.",
            "instagram": "¡Síguenos en @UrbanHustler! Ahí subimos outfits, sorteos y novedades.",
            "diferencia": "No vendemos solo ropa, vendemos identidad. La calidad de nuestra tela y los cortes no los vas a encontrar en otro lado. 😉",

            // 👕 2. Preguntas sobre productos
            "remera": "Tenemos remeras Oversize (amplias) y Regular Fit. Algodón 100% peinado. ¿Buscas lisa o estampada?",
            "pantalon": "Tenemos cargos, joggers y jeans. Son súper cómodos y resistentes. ¿Qué estilo preferís?",
            "jean": "Nuestros jeans tienen ese toque roto/gastado que se usa ahora. Calce espectacular.",
            "buzo": "Los buzos son nuestra especialidad. Frisa invisible pesada, abrigan de verdad y no hacen pelotitas.",
            "campera": "Tenemos rompevientos y camperas puffer para cuando refresca. Chequeá la sección de abrigos.",
            "invierno": "¡Sí! Hoodies pesados y camperas para que el frío no te pare.",
            "verano": "Tenemos remeras livianas, musculosas y shorts de baño con toda la onda.",
            "oversize": "¡Es nuestro sello! Corte amplio, hombros caídos, mucha comodidad. Si no usaste nunca, es un viaje de ida.",
            "talles grandes": "Sí, nuestra moldería es amplia y real. Queremos que todos se sientan cómodos.",
            "conjunto": "Podés armar tu propio conjunto combinando hoodie y jogger. ¡Quedan increíbles juntos!",
            "colores": "Manejamos una paleta urbana: Negro, Blanco, Beige, Gris y algunos toques de color de temporada.",
            "otro color": "Fijate en el detalle del producto, ahí aparecen las variantes disponibles. Si no está, es que voló.",
            "grueso": "Sí, nuestros hoodies son de frisa premium. Tienen cuerpo y caída, no son esos finitos que se deforman.",
            "algodon": "Usamos algodón 100% de primera calidad. Suave al tacto y duradero.",
            "lavar": "Si seguís las instrucciones (agua fría, no secadora), la prenda se mantiene impecable. Ya vienen pre-lavadas para que no achiquen.",
            "comodo": "La comodidad es nuestra prioridad número 1. Ropa para vivirla, no para sufrirla.",
            "formal": "Es más informal/urbano, pero con los accesorios correctos podés levantar el look para una salida nocturna.",
            "salir": "¡Re! Un buen hoodie, un jean y unas zapas limpias es el uniforme oficial de la noche.",
            "trabajo": "Depende de tu trabajo, pero para ambientes creativos o informales, va perfecto.",
            "mas vendido": "El 'Urban Hoodie Black' es el rey indiscutido. 👑 Nunca falla.",

            // 📏 3. Preguntas de talles y calce (MUY importantes)
            "talle soy": "Para orientarte mejor: ¿Cuánto medís y pesás aprox? Igual, nuestra tabla de talles en la web es súper precisa.",
            "mido": "Buen dato. Si medís alrededor de 1.75m, un L te va a quedar con ese efecto oversize perfecto. Si lo querés más justo, un M.",
            "peso": "El peso también influye. Si sos de contextura grande, andá por un talle más para mantener el estilo suelto.",
            "calza": "Nuestros modelos calzan GRANDE (Oversize). Si solés ser L en marcas tradicionales, acá un M te puede ir bien.",
            "fit": "La mayoría es Oversize Fit (suelto). También tenemos algunos cortes Regular, pero el ADN es urbano.",
            "tabla": "En cada producto tenés un botón que dice 'Ver Tabla de Talles'. Medite una prenda tuya y compará, ¡no falla!",
            "estira": "Los joggers y remeras ceden un poco. Los jeans y cargos son más rígidos pero tienen moldería cómoda.",
            "larga": "Las remeras son un poco más largas de lo normal, ideales para el look streetwear.",
            "recto": "Los pantalones suelen ser de corte recto o levemente entubados abajo (joggers).",
            "ajustado": "No solemos hacer ropa muy ajustada (slim fit). Apostamos a la libertad de movimiento.",
            "alto": "Si sos alto, quedate tranquilo que el largo de nuestras prendas está pensado para que no te queden cortas.",
            "bajo": "Si sos de estatura baja, podés usar los talles S o M y lograr ese look 'baggy' que está de moda.",
            "cintura": "Los joggers y shorts tienen cintura elástica y cordón regulable. ¡Se adaptan a vos!",
            "equivale": "Pensalo así: Nuestro S es como un M de otras marcas. Nuestro M como un L. Son amplios.",
            "cambiarlo": "¡Obvio! Si no te queda como esperabas, tenés 30 días para cambiarlo sin drama. 👌",

            // 💰 4. Preguntas sobre precios
            "cuanto sale": "Los precios varían según la prenda, pero arrancan desde $25.000 las remeras. ¡Calidad premium a precio justo!",
            "descuento": "Si pagás por transferencia bancaria, solemos tener un descuento extra. ¡Fijate al final del checkout!",
            "oferta": "Chequeá la sección 'Sale' en el menú. Siempre hay joyitas a precios increíbles.",
            "promo": "Suscribite al newsletter para enterarte antes que nadie de los 2x1 y descuentos flash.",
            "2x1": "A veces lanzamos 2x1 en remeras o accesorios. ¡Seguinos en redes para no perdértelo!",
            "cuotas": "¡Sí! Tenemos 3 y 6 cuotas sin interés con tarjetas bancarias. 💳",
            "tarjeta": "Aceptamos todas: Visa, Master, Amex, Cabal. Comprá ahora y pagá después.",
            "efectivo": "En el local podés pagar en efectivo. A veces hay mimos extra por pago cash. 😉",
            "mercado pago": "¡Sí, de una! Aceptamos dinero en cuenta de Mercado Pago.",
            "transferencia": "Sí, y suele tener un 10% o 15% de descuento. ¡Es la que va!",
            "impuestos": "El precio que ves es el final. Sin sorpresas ni letras chicas.",
            "precio final": "Exacto, precio final IVA incluido.",
            "diferencia precio": "Los precios son los mismos en la web y en el local. Transparencia total.",
            "cuando oferta": "Solemos hacer ofertas en fechas especiales (Hot Sale, Cyber Monday) y cambios de temporada.",

            // 🚚 5. Envíos y tiempos
            "envios": "Hacemos envíos a TODO el país. 🇦🇷 No importa si estás en Jujuy o Tierra del Fuego.",
            "todo el pais": "Sí, llegamos a cada rincón de Argentina a través de Correo Argentino y Andreani.",
            "costo envio": "El costo depende de tu código postal, pero si tu compra supera los $80.000, ¡es GRATIS!",
            "tarda": "Generalmente entre 3 y 5 días hábiles desde que despachamos. Hacemos todo para que llegue rápido.",
            "mi ciudad": "Si llega el correo, llegamos nosotros. Poné tu CP en el carrito para calcular exacto.",
            "retirar": "Sí, podés elegir 'Retiro en Local' y pasar a buscarlo por Apóstoles sin costo.",
            "correo": "Trabajamos con Andreani y Correo Argentino. Vos elegís el que prefieras.",
            "seguimiento": "¡Sí! Apenas sale tu paquete te mandamos el tracking por mail para que lo sigas en vivo.",
            "envian hoy": "Si comprás antes del mediodía, intentamos despachar en el día. Si no, sale al siguiente día hábil.",
            "fin de semana": "Los correos no despachan findes, pero nosotros preparamos tu pedido para que salga el lunes a primera hora.",
            "no estoy": "El correo suele hacer dos visitas. Si no te encuentran, te dejan un aviso para retirar en sucursal.",
            "cambiar direccion": "Escribinos URGENTE por WhatsApp si te equivocaste. Si no salió todavía, lo corregimos.",
            "interior": "Somos del interior (Misiones), así que entendemos la importancia de que llegue bien a todos lados.",
            "capital": "A CABA y GBA suele llegar súper rápido, a veces en 48hs.",
            "envio gratis": "¡Sí! Comprando más de $80.000 el envío te lo regalamos nosotros. Aprovechalo.",

            // 8. Preguntas informales / humanas (clave para fluidez)
            "perdido": "Tranqui, es normal con tantas opciones. 😂 Decime: ¿Para qué situación querés la ropa? ¿Salida, relax, trabajo?",
            "no se": "Si no sabés qué elegir, andá a los clásicos: Remera Blanca Oversize + Jean. Nunca falla.",
            "lindo": "Todo lo que hacemos es lindo 😉, pero si buscás comodidad, andá por los conjuntos de frisa.",
            "salir noche": "Para la noche: Hoodie Negro (siempre garpa) o una remera con estampa grande en la espalda.",
            "tranqui": "Si querés algo bajo perfil, mirá nuestra línea 'Essentials'. Colores neutros, sin estampas gigantes.",
            "combine": "El negro, blanco y gris combinan con todo. Armate una base con esos colores y estás hecho.",
            "gastar poco": "Fijate en la sección de remeras o accesorios. Podés renovar el look sin gastar una fortuna.",
            "armar outfit": "Dale. Probá esto: Pantalón Cargo Beige + Remera Negra Oversize + Zapas blancas. ¡Fuego! 🔥",
            "vos que": "Yo soy una IA, pero si tuviera cuerpo usaría el Hoodie Urban Black todos los días. Es icónico.",
            "se usa": "El oversize y los cargos son la tendencia mundial ahora mismo. Estás comprando moda actual.",
            "moda": "Totalmente. Nos inspiramos en lo que se usa en las calles de NY, Londres y Tokio.",
            "no ajustado": "¡Perfecto! Estás en el lugar indicado. Acá odiamos la ropa apretada. Libertad ante todo.",
            "colores fuertes": "Entendido. Tenemos mucho en negro, gris, crudo y azul marino. Sobrio pero con estilo.",
            "distinto": "Si querés algo distinto, mirá nuestras estampas de edición limitada. Son diseños propios, no los tiene nadie más.",

            // 🧠 10. Preguntas que prueban la “inteligencia” de la AI
            "conviene comprar": "Hoy te conviene aprovechar los Hoodies porque es temporada y vuelan. O buscar en Ofertas si querés cuidar el bolsillo.",
            "mejor calidad": "Toda nuestra línea 'Premium' tiene la mejor calidad de tela del mercado. No vas a notar diferencia con marcas internacionales.",
            "esto o este": "Esa es difícil... Si buscás abrigo, el Hoodie. Si buscás versatilidad para todo el año, la Campera rompevientos.",
            "ahora": "Si comprás ahora, te asegurás el stock. Mañana capaz ya no está tu talle. Yo que vos, no me arriesgo. ⏳",
            "se vende mas": "Lo más vendido son los Hoodies Negros y los Pantalones Cargo. Son los favoritos de la comunidad.",
            "edad": "La ropa no tiene edad, tiene actitud. Tenemos clientes de 15 y de 50. Si te sentís bien, te queda bien.",
            "queda mejor": "Eso depende de tu gusto, pero el corte Oversize suele favorecer a todos porque estructura bien los hombros.",
            "mas barato": "Si buscás precio, andá a la sección de Remeras o aprovechá los packs de medias y accesorios.",
            "mas elegante": "Para algo más 'arreglado', un pantalón de gabardina negro y una remera lisa de buena calidad van perfecto.",
            "mas deportivo": "Joggers y buzos canguro. Es el combo definitivo para estar cómodo y con onda.",
            "robot": "Jaja, soy una IA 🤖 pero con mucho flow. Estoy programada para ayudarte como si fuera un amigo.",
            "humano": "Si preferís hablar con un humano real, tocá el botón de WhatsApp. Pero te prometo que yo le pongo onda. 😎",

            // Cierre y Default
            "gracias": "¡De nada{name}! Espero ver ese pedido pronto. Cualquier otra cosa, chiflame. 🤙",
            "chau": "¡Nos vemos{name}! No te cuelgues con el carrito que el stock vuela. 👋",
            "default": "¡Esa es una buena pregunta{name}! 🤔 No estoy 100% seguro, pero creo que lo mejor es que mires el catálogo o nos escribas al WhatsApp. ¿Te ayudo con otra cosa?"
        };
        this.init();
    }

    init() {
        this.injectHTML();
        this.cacheDOM();
        this.bindEvents();
        this.startIdleTimer(); // Iniciar contador de 4 minutos
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

    startIdleTimer() {
        // 4 minutos = 240000 ms
        this.idleTimer = setTimeout(() => {
            if (!this.isOpen) {
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
}

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotManager();
});