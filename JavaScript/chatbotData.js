/**
 * URBANHUSTLER AI KNOWLEDGE BASE
 * Base de datos de conocimiento para el Asistente Virtual.
 * 
 * CONTEXTO:
 * - Marca: UrbanHustler (Streetwear Premium)
 * - Ubicación: Apóstoles, Misiones (Suipacha 282)
 * - Estilo: Oversize, Urbano, Cargo, Drill, Techwear.
 * - Envíos: Todo el país (Andreani/Correo Argentino).
 * - Pagos: Cuotas, Transferencia (-10%), Crypto, Efectivo.
 */

window.CHATBOT_DATA = {
    // =============================================================================
    // 1. SALUDOS Y FLUJO INICIAL (HUMANIZACIÓN)
    // =============================================================================
    "hola": "¡Hola{name}! 👋 Bienvenido al cuartel general de UrbanHustler. ¿En qué te puedo ayudar hoy? ¿Buscas renovar tu outfit o hacer un regalo?",
    "holis": "¡Holis{name}! ✨ ¿Qué onda? ¿Buscás algo lindo para estrenar?",
    "buenas": "¡Buenas! 👋 ¿Qué onda? ¿Buscás algo en especial o estás mirando?",
    "buenos dias": "¡Buen día{name}! ☀️ ¿Arrancamos la jornada con estilo? Contame qué estás buscando.",
    "buen dia": "¡Buen día{name}! ☀️ ¿Arrancamos la jornada con estilo? Contame qué estás buscando.",
    "buenas tardes": "¡Buenas tardes{name}! 🔥 Ideal para chequear los nuevos drops. ¿Te ayudo con talles o modelos?",
    "buenas noches": "¡Buenas noches{name}! 🌙 El estilo no duerme. ¿Buscás algo para salir o para estar chill?",
    "que tal": "¡Todo tranqui por acá! 🤙 ¿Vos cómo venís? ¿Buscando pilcha nueva?",
    "como va": "¡Todo joya! 💎 Con ganas de ayudarte a encontrar el mejor fit.",
    "chau": "¡Nos vemos{name}! 👋 No te cuelgues que el stock vuela. ¡Cuidate!",
    "adios": "¡Hasta la próxima! Acordate que siempre subimos novedades a Instagram. 🚀",
    "hasta luego": "¡Nos vemos! Cualquier cosa estamos por acá o en WhatsApp.",
    "nos vemos": "¡Dale, nos vemos! 👋 Que andes bien.",
    "bye": "¡Bye bye! 👋",
    "gracias": "¡De nada{name}! Es un placer. 🙏 Cualquier otra duda, chiflame. Estamos para eso.",
    "muchas gracias": "¡A vos por la buena onda! 🙌",
    "gracias genio": "¡De nada crack! 😎 Para eso estamos.",
    "ok": "¡Dale! 👌 ¿Alguna otra consulta?",
    "dale": "¡Joya! 😉",
    "quien sos": "Soy la IA de UrbanHustler 🤖, entrenada con el mejor flow de Misiones para el mundo. Estoy acá para asesorarte 24/7.",
    "sos un robot": "Soy una Inteligencia Artificial con mucho estilo. 🤖 Pero si preferís hablar con un humano, pedime el WhatsApp.",
    "sos persona": "No, soy un asistente virtual 🤖. Pero mis respuestas están basadas en lo que Facu y Wiliam (los dueños) te dirían.",
    "humano": "Si querés hablar con una persona real, tocá el ícono de WhatsApp abajo a la derecha. Ellos te atienden en horario comercial.",
    "hablar con alguien": "Para atención personalizada humana, escribinos al WhatsApp. El ícono está en la esquina.",
    "nombre": "Me dicen UrbanAI, pero podés decirme 'Genio' si encontrás lo que buscás. 😉",
    "real": "¿Soy real? Tan real como la calidad de nuestros hoodies. Aunque vivo en la nube, mi objetivo es concreto: que te vistas bien.",
    "como estas": "¡Operativo al 100% y con ganas de ayudarte a encontrar tu mejor versión! ¿Vos cómo venís?",
    "todo bien": "¡Me alegro mucho! 😎 Entonces, ¿qué te parece si miramos unos Hoodies o Cargos?",
    "todo mal": "Uh, qué bajón. 😕 A veces un buen outfit nuevo levanta el ánimo. ¿Querés ver algo para distraerte?",
    "aburrido": "Si estás aburrido, chequeá nuestra sección 'New Drops'. Hay cosas que te van a volar la cabeza. 🤯",

    // =============================================================================
    // 2. IDENTIDAD DE MARCA Y LOCAL (LORE)
    // =============================================================================
    "donde estan": "Nuestro búnker está en **Apóstoles, Misiones**. 🇦🇷 Calle **Suipacha 282**. Si andás cerca, pasate a saludar.",
    "de donde son": "Somos de Apóstoles, Misiones. Orgullo del interior. 🌿 Hacemos envíos a todo el país.",
    "direccion": "Anotá: Suipacha 282, Apóstoles, Misiones. Es nuestro único local oficial por ahora.",
    "ubicacion": "Estamos en el corazón de Apóstoles: Suipacha 282. Hacemos envíos a todo el país, así que llegamos a tu puerta estés donde estés.",
    "local": "¡Sí! Tenemos showroom en Suipacha 282, Apóstoles. Vení a tocar la tela y probarte todo. La vibra del local es única.",
    "tienen local": "Sí, en Apóstoles (Misiones). Si no sos de acá, nuestra web es tu local 24/7.",
    "horario": "Tomá nota 📝: Abrimos de **Lunes a Sábado**. \nMañanas: 09:30 a 12:30hs.\nTardes: 17:00 a 21:30hs.\nDomingos descansamos para volver con todo.",
    "a que hora abren": "A las 09:30hs por la mañana y a las 17:00hs por la tarde.",
    "a que hora cierran": "Cerramos a las 12:30hs al mediodía y a las 21:30hs a la noche.",
    "abierto": "Depende de la hora que sea. Nuestro horario es 09:30-12:30 y 17:00-21:30 (Lun-Sab). Si es domingo, estamos recargando energías.",
    "domingo": "Los domingos descansamos 😴. Pero la web está abierta 24/7 para que compres cuando quieras.",
    "feriado": "Los feriados solemos avisar en Instagram si abrimos. Seguinos en @UrbanHustler para estar al tanto.",
    "historia": "UrbanHustler nació de la necesidad de ropa urbana real en el interior. No vendemos solo tela, vendemos identidad. Calidad exportación, corazón argentino.",
    "dueño": "El cerebro detrás de esto es Facundo, junto con Wiliam en la parte técnica. Un equipo que le mete pasión a cada costura.",
    "fabricantes": "Somos marca propia. Diseñamos y producimos cuidando cada detalle. No revendemos genéricos, creamos cultura.",
    "revenden": "No, somos fabricantes. Diseñamos nuestros propios cortes y estampas.",
    "misiones": "Orgullosamente misioneros. 🌿 Llevamos el estilo de la tierra colorada a todo el país. El talento del interior pisa fuerte.",
    "marca": "UrbanHustler no es solo una marca, es un movimiento. Representamos a los que se mueven, a los que crean, a los que no se conforman.",
    "confiable": "Totalmente. Llevamos años vistiendo a la comunidad. Podés ver las reseñas en Google o en nuestras historias destacadas de Instagram.",
    "estafa": "¡Para nada! Somos un local real, con gente real y productos reales. Podés venir a vernos a Suipacha 282 cuando quieras.",
    "seguro": "El sitio es 100% seguro. Usamos certificados SSL y procesamos pagos con Mercado Pago, que protege tu dinero.",
    "redes": "Seguinos en Instagram @UrbanHustler para ver los drops antes que nadie y participar de sorteos.",
    "instagram": "Nuestro IG es el corazón de la comunidad: @UrbanHustler. Ahí subimos outfits y novedades diarias.",
    "facebook": "También estamos en Facebook como UrbanHustler, pero la movida fuerte está en Instagram.",
    "tiktok": "¡Sí! Buscanos en TikTok para ver videos de los productos en detalle y backstage.",
    "whatsapp": "Nuestro WhatsApp es 3758-545846. Escribinos para dudas puntuales.",
    "telefono": "Manejamos todo por WhatsApp para que quede registro y sea más ordenado: 3758-545846.",
    "mail": "Nuestro mail es contacto@urbanhustler.com.ar, pero respondemos más rápido por WhatsApp.",

    // =============================================================================
    // 3. PRODUCTOS: HOODIES Y BUZOS (CORE)
    // =============================================================================
    "hoodie": "Los Hoodies son nuestra especialidad. 🏆 Usamos frisa invisible pesada (premium). Capucha doble, cordones reforzados y moldería Oversize real.",
    "buzo con capucha": "Sí, a los buzos con capucha les decimos Hoodies. Son lo más cómodo que vas a probar.",
    "buzo": "Tenemos buzos Crewneck (cuello redondo) y Hoodies (con capucha). ¿Buscás algo liso minimalista o con estampa heavy?",
    "canguro": "El clásico canguro con bolsillo delantero. Ideal para guardar el celu o las manos cuando refresca. Chequeá el modelo 'Urban Black'.",
    "frisa": "Nuestra frisa es 'Invisible Premium'. ¿Qué significa? Que es suave por dentro, no hace pelotitas (peeling) y aguanta mil lavados.",
    "tela": "Usamos algodón 100% peinado 24/1 para remeras y Frisa Invisible Pesada para abrigos. Calidad tope de gama.",
    "material": "Solo usamos materiales premium. Nada de telas sintéticas baratas que pican o hacen transpirar mal.",
    "abrigo": "Si buscás abrigo en serio, nuestros Hoodies pesan. No son esos finitos que se vuelan. Son una armadura contra el frío.",
    "invierno": "Para invierno, el Hoodie Oversize es obligatorio. Ponete una térmica abajo y estás listo para la nieve.",
    "estampa": "Usamos serigrafía al agua y plastisol de alta densidad. No se cuartea ni se borra. Diseños propios inspirados en la cultura urbana.",
    "se sale la estampa": "¡No! Usamos tintas de alta calidad y curado en horno. Si la cuidás (no planchar arriba), dura años.",
    "bordado": "Algunos modelos vienen con logo bordado minimalista. Fijate en los detalles de cada producto.",
    "liso": "El Hoodie Liso es un 'Essential'. Tenemos en Negro, Beige, Gris Melange, Blanco y Verde Militar. Combinan con todo.",
    "oversize hoodie": "El corte es amplio, hombros caídos (drop shoulder). Si te gusta que te quede suelto, pedí tu talle. Si lo querés más al cuerpo, uno menos.",
    "calidad hoodie": "Es lo mejor que vas a encontrar. Algodón peinado, costuras reforzadas y una moldería que cae perfecta.",
    "colores hoodie": "Negro, Blanco, Gris, Beige, Verde Militar, Azul Marino y a veces sacamos colores de temporada como Lila o Naranja.",
    "buzo cuello redondo": "El Crewneck es un clásico. Sin capucha, ideal para usar con camisa abajo o solo. Mismo calce oversize.",
    "campera": "Tenemos camperas Puffer y Rompevientos. Ideales para completar el layer (capas) en invierno.",
    "zip hoodie": "A veces sacamos Hoodies con cierre (Zipper). Fijate en la sección de abrigos si hay stock.",

    // =============================================================================
    // 4. PRODUCTOS: PANTALONES (CARGO, JOGGER, JEAN)
    // =============================================================================
    "pantalon": "Tenemos la trinidad del streetwear: Cargos, Joggers y Jeans. ¿Para qué ocasión los querés?",
    "cargo": "Los Pantalones Cargo son tendencia. 🔥 Tela Gabardina rígida o elastizada (según modelo), bolsillos laterales funcionales y corte recto.",
    "cargo negro": "El Cargo Negro es el más vendido. Combina con todo y tiene toda la onda.",
    "cargo beige": "El Cargo Beige es clave para looks de día. Queda increíble con remeras blancas o negras.",
    "jogger": "Comodidad nivel Dios. ☁️ Joggers de frisa (invierno) o rústicos (verano). Puño abajo para lucir las zapas.",
    "jogger gris": "El clásico Jogger Gris Melange. Ideal para estar en casa, entrenar o salir tranqui.",
    "jean": "Nuestros Jeans tienen moldería 'Mom' o 'Baggy'. Rotos, gastados o clásicos. El calce es relajado, nada de chupines apretados acá.",
    "jean roto": "Los jeans con roturas (ripped) le dan ese toque grunge/urbano que buscás.",
    "jean negro": "Jean negro gastado. Un básico que no puede faltar en tu placard.",
    "drill": "Tenemos pantalones de Drill (tela resistente tipo trabajo) ideales para darle uso rudo o para un look Techwear.",
    "bermuda": "Para el calor, Bermudas Cargo y Shorts de baño. Mantené el estilo aunque hagan 40 grados.",
    "bermuda cargo": "Misma onda que el pantalón pero corto. Bolsillos amplios y corte urbano.",
    "short": "Shorts de algodón rústico para estar en casa o entrenar, y de baño para la pile/playa con secado rápido.",
    "malla": "Tenemos shorts de baño con secado rápido y suspensor. Diseños lisos y estampados.",
    "bolsillos": "Los cargos tienen bolsillos reales y profundos. Nada de bolsillos falsos. Entra la billetera, el celu y las llaves.",
    "gabardina": "Usamos gabardina de 8oz. Resistente pero no dura como cartón. Se ablanda con el uso y queda increíble.",
    "tiro": "Nuestros pantalones son de tiro medio/alto, pensados para la comodidad y el estilo urbano actual.",
    "chupin": "No trabajamos chupines (skinny). Nuestro estilo es más relajado (Regular, Mom, Baggy, Cargo). Es más cómodo y actual.",
    "ancho": "Sí, la mayoría de nuestros pantalones tienen corte ancho o recto. Es la tendencia.",

    // =============================================================================
    // 5. PRODUCTOS: REMERAS (TEES)
    // =============================================================================
    "remera": "Remeras 100% Algodón Peinado 24/1. ¿Qué significa? Que es suave, fresca y no se deforma. Cuello con reeb de calidad.",
    "oversize remera": "Nuestras remeras Oversize son amplias de verdad. Mangas hasta el codo, largo ideal. El fit que ves en Instagram.",
    "regular fit": "También tenemos corte Regular (clásico) para quienes prefieren algo más al cuerpo pero sin apretar.",
    "musculosa": "Musculosas con sisa amplia (cavadas) para entrenar o para los días de mucho calor. Estilo basket urbano.",
    "chomba": "A veces sacamos ediciones limitadas de Chombas estilo Rugby o Polo Oversize. Fijate en 'New Drops'.",
    "blanca": "La Remera Blanca Oversize es el lienzo de tu outfit. Tiene que estar impecable. La nuestra no transparenta.",
    "negra": "La Remera Negra no puede faltar. Es la base de cualquier look 'All Black'.",
    "cuello": "El cuello tiene reeb con elastano, no se estira ni se deforma con los lavados. Queda siempre pegadito.",
    "algodon": "Algodón 100% Premium. Nada de mezclas sintéticas que te hacen transpirar.",
    "estampas": "Las estampas son diseños exclusivos. Usamos serigrafía que no se despega con el calor.",
    "remera lisa": "Las lisas vienen en pack o sueltas. Son la base de cualquier guardarropa.",
    "remera estampada": "Tenemos estampas en espalda (back print) y en frente (chest print). ¿Cuál te gusta más?",
    "back print": "Las remeras con estampa en la espalda son tendencia. De frente se ven limpias y de atrás impactan.",
    "heavy tee": "Tenemos algunas ediciones 'Heavyweight' (algodón pesado) para un look más estructurado.",

    // =============================================================================
    // 6. TALLES Y FIT (ASESORAMIENTO)
    // =============================================================================
    "talle": "Nuestra moldería es **REAL y AMPLIA**. No achicamos talles. \nS = M de otros.\nM = L de otros.\nMirá la tabla de medidas en cada producto.",
    "medidas": "Te recomiendo medir una prenda tuya (de axila a axila y largo) y comparar con nuestra tabla. Es la forma infalible.",
    "tabla de talles": "En la web, dentro de cada producto, tenés el botón 'Ver Tabla de Talles'. Ahí está la posta.",
    "guia de talles": "La guía está en la descripción de cada producto. Si tenés dudas, pasame tu altura y peso y te ayudo.",
    "soy s": "Si sos S en marcas tradicionales, nuestro S te va a quedar holgado (estilo urbano). Si querés que te quede justo, quizás somos muy grandes para vos 😉.",
    "soy m": "El talle M es nuestro comodín. Va perfecto para alturas entre 1.70m y 1.78m contextura media.",
    "soy l": "El L es bien amplio. Si medís más de 1.80m o te gusta bien suelto, es el tuyo.",
    "soy xl": "Nuestro XL es un verdadero XL. Entrás cómodo, sobra tela, cae perfecto. Nada de remeras cortas.",
    "xxl": "Algunos modelos vienen en XXL. Filtrá por talle en la tienda para ver qué hay disponible.",
    "3xl": "Por el momento llegamos hasta XXL en algunos modelos. Estamos trabajando para ampliar la curva.",
    "mujer talle": "Para chicas, el S suele quedar como un vestido/remerón (muy de moda) o un buzo bien boyfriend. ¡Queda genial!",
    "unisex": "Toda nuestra ropa es Unisex. El estilo no tiene género. Lo que importa es cómo te sentís vos.",
    "cambio talle": "Si le pifiaste al talle, tranqui. Tenés 30 días para cambiarlo. El primer cambio suele ser bonificado si es error nuestro.",
    
    // --- ASESORAMIENTO POR ALTURA (CASOS ESPECÍFICOS) ---
    "mido 1.50": "Para 1.50m, el talle S te va a quedar bien Oversize. Ideal para usar con calzas o bikers.",
    "mido 1.55": "Con 1.55m, andá por el S. Te va a quedar suelto y cómodo.",
    "mido 1.60": "Para 1.60m, el S es tu talle. Te va a quedar amplio, estilo Billie Eilish.",
    "mido 1.65": "Si medís 1.65m, el S te queda joya. Si querés muy gigante, probá el M.",
    "mido 1.70": "Para 1.70m, un talle M te va a quedar con un fit oversize relajado. Si sos muy flaco, un S también va.",
    "mido 1.75": "Con 1.75m estás en el límite. M para fit normal/suelto, L para bien Oversize.",
    "mido 1.80": "Para 1.80m, andá directo al L. Te va a quedar joya de largo y mangas.",
    "mido 1.85": "Si medís 1.85m, el L te va bien, pero si te gusta largo, andá por el XL.",
    "mido 1.90": "Para 1.90m, necesitás XL o XXL para que no te quede corta de mangas.",
    "mido 1.95": "Con 1.95m, definitivamente XXL. Chequeá las medidas de largo en la tabla.",
    
    // --- ASESORAMIENTO POR PESO ---
    "peso 50": "Si pesás 50kg, el S te va a quedar holgado. Es el estilo de la marca.",
    "peso 60": "Con 60kg, el S va bien. Si sos alto, quizás M por el largo.",
    "peso 70": "Para 70kg, el M suele ser el punto justo.",
    "peso 80": "Con 80kg, un L te va a quedar cómodo.",
    "peso 90": "Si estás en 90kg, andá por el XL para estar cómodo de espalda y hombros.",
    "peso 100": "Para 100kg o más, chequeá el XXL. Nuestra moldería es generosa.",

    "taya": "Si buscás tu talle (se escribe con 'll' 😉), fijate en la tabla de medidas dentro de cada producto.",
    "achica": "Nuestras prendas vienen pre-lavadas industrialmente, así que el achicamiento es mínimo (menos del 3%). Lavá siempre con agua fría.",
    "se agranda": "El algodón de calidad mantiene su forma. No se deforma si lo cuidás bien.",
    "cede": "La frisa cede un poco con el uso, pero vuelve a su lugar al lavar. El jean rígido cede media pulgada.",

    // =============================================================================
    // 7. ENVÍOS Y LOGÍSTICA
    // =============================================================================
    "envio": "Hacemos envíos a todo el país 🇦🇷. Usamos **Andreani** y **Correo Argentino**. Vos elegís en el checkout.",
    "embio": "Hacemos envíos a todo el país. Poné tu código postal en el carrito para ver el costo.",
    "costo envio": "El costo se calcula con tu Código Postal en el carrito. \n💡 **DATO:** Si comprás más de $80.000, el envío es **GRATIS**.",
    "cuanto sale el envio": "Depende de dónde vivas. Agregá algo al carrito y poné tu CP para ver el precio exacto.",
    "envio gratis": "¡Sí! Superando los $80.000 el envío corre por nuestra cuenta. 🚚💨",
    "gratis": "¡Sí! Superando los $80.000 en tu compra, nosotros pagamos el envío. Aprovechalo sumando unas medias o accesorios.",
    "tiempo": "Despachamos dentro de las 24/48hs hábiles. El correo tarda entre 3 y 6 días dependiendo de dónde vivas.",
    "seguimiento": "Te llega un mail con el código de tracking apenas despachamos. Podés seguirlo en la web del correo.",
    "tracking": "El tracking te llega al mail que usaste para comprar. Fijate en Spam por las dudas.",
    "no me llego el mail": "Si no te llegó el mail de confirmación, escribinos por WhatsApp con tu nombre y lo revisamos.",
    "retiro": "Podés retirar GRATIS por nuestro local en Apóstoles (Suipacha 282). Elegí 'Retiro en Local' al comprar.",
    "moto": "Por ahora no tenemos moto mensajería propia fuera de Apóstoles. Todo va por correo seguro.",
    "llega a": "Llegamos a Tierra del Fuego, Jujuy, CABA, Córdoba... Si hay una calle, llegamos.",
    "codigo postal": "Poné tu CP en el carrito y te dice exacto cuánto sale y cuándo llega.",
    "tarda mucho": "A veces el correo se demora en fechas clave (Hot Sale, Navidad). Te pedimos un poquito de paciencia, siempre llega.",
    "empaquetado": "Mandamos todo en bolsas e-commerce reforzadas e impermeables. Tu ropa llega impecable.",
    
    // --- ENVÍOS POR PROVINCIA ---
    "buenos aires": "A Buenos Aires (CABA/GBA) suele llegar en 3 o 4 días hábiles.",
    "caba": "A Capital Federal llega rápido. Andreani suele ser la mejor opción.",
    "cordoba": "A Córdoba capital llega rápido, unos 4 días hábiles aprox.",
    "rosario": "A Rosario llega en 3-4 días hábiles.",
    "santa fe": "A Santa Fe llega sin problemas en unos días.",
    "mendoza": "A Mendoza tarda unos 5 días hábiles en llegar.",
    "tierra del fuego": "Sí, hacemos envíos a Tierra del Fuego. Tené en cuenta que puede tardar un poquito más por aduana/logística.",
    "chaco": "Al Chaco llega al toque, estamos cerca.",
    "corrientes": "A Corrientes llega rapidísimo, somos vecinos.",
    "formosa": "Sí, llegamos a Formosa sin drama.",
    "neuquen": "A Neuquén llega perfecto. Ideal para pedir hoodies para el frío.",
    "salta": "Llegamos a Salta la linda en unos 5 días hábiles.",
    "jujuy": "Sí, enviamos a Jujuy por Correo Argentino o Andreani.",
    "tucuman": "A Tucumán llega en 4-5 días.",
    "entre rios": "A Entre Ríos llega rápido.",
    "san juan": "Sí, llegamos a San Juan.",
    "san luis": "Sí, enviamos a San Luis.",
    "la pampa": "Llegamos a La Pampa.",
    "rio negro": "Sí, enviamos a Río Negro.",
    "chubut": "Llegamos a Chubut.",
    "santa cruz": "Sí, enviamos a Santa Cruz.",
    "catamarca": "Llegamos a Catamarca.",
    "la rioja": "Sí, enviamos a La Rioja.",
    "santiago del estero": "Llegamos a Santiago del Estero.",

    // =============================================================================
    // 8. PAGOS Y PROMOCIONES
    // =============================================================================
    "pagar": "Podés pagar con Tarjeta (Crédito/Débito), Mercado Pago, Transferencia o Efectivo (en el local).",
    "pagos": "Aceptamos todas las tarjetas, Mercado Pago, Transferencia (-10% OFF) y Efectivo.",
    "pago": "Podés abonar tu compra con Tarjeta, Transferencia, Mercado Pago o Efectivo.",
    "metodos de pago": "Tenés muchas opciones: Tarjetas de crédito/débito (3 y 6 cuotas sin interés), Transferencia bancaria (con descuento), Mercado Pago y Efectivo en el local.",
    "formas de pago": "Aceptamos Tarjetas, Mercado Pago, Transferencia y Efectivo. ¡Vos elegís!",
    "medios de pago": "Trabajamos con Mercado Pago, así que podés usar todas las tarjetas. También transferencia y efectivo.",
    "cuotas": "Ofrecemos **3 y 6 cuotas sin interés** con tarjetas bancarias. ¡Financiate el outfit!",
    "sin interes": "Sí, 3 y 6 cuotas sin interés con tarjetas bancarias (Visa, Master).",
    "interes": "Si elegís más de 6 cuotas, la plataforma puede aplicar interés. Fijate en el checkout.",
    "transferencia": "Si pagás por transferencia, tenés un **10% de descuento** automático. Es la opción más inteligente. 🧠",
    "cbu": "El CBU te aparece al finalizar la compra eligiendo 'Transferencia'.",
    "efectivo": "En el local aceptamos efectivo. A veces hay descuentos sorpresa por pago cash.",
    "rapipago": "Podés pagar en efectivo vía Rapipago/PagoFácil eligiendo Mercado Pago en el checkout.",
    "pagofacil": "Sí, a través de Mercado Pago podés generar el cupón.",
    "descuento": "Suscribite al Newsletter (abajo en la web) y te mandamos cupones exclusivos. También chequeá la sección 'Ofertas'.",
    "cupon": "Si tenés un cupón, ponelo en el carrito donde dice 'Código de descuento'.",
    "precio": "Los precios están en la web. Son finales (IVA incluido). Lo que ves es lo que pagás.",
    "costaria": "El precio depende de qué prendas elijas. Un outfit completo (Hoodie + Cargo) ronda los $80.000 aprox.",
    "cuanto sale": "Fijate en la web para el precio exacto, pero calculale unos $45k un Hoodie y $35k un pantalón.",
    "cuanto esta": "Los precios varían según el modelo. Entrá al producto para ver el valor actualizado.",
    "valor": "El valor de nuestras prendas refleja la calidad premium que manejamos.",
    "costo": "El costo depende del producto. Hoodies desde $45.000, Remeras desde $25.000.",
    "total": "El total lo ves en el carrito antes de pagar. Acordate que si superás $80.000 el envío es gratis.",
    "presio": "Los precios están actualizados en la web. Entrá a cada producto para ver el valor.",
    "cuanto cuesta": "El precio depende del producto. Los Hoodies rondan los $45k y las Remeras $25k. Fijate en el catálogo.",
    "sale": "Chequeá la sección 'Ofertas' en el menú. Siempre hay oportunidades de temporadas anteriores.",
    "mayorista": "¿Tenés local? Escribinos por WhatsApp para consultar condiciones de venta mayorista. Queremos socios en todo el país.",
    "revender": "Si querés revender, contactanos por WhatsApp. Tenemos lista de precios mayorista con mínimos de compra.",
    "tarjeta": "Aceptamos Visa, Master, Amex, Cabal... todas las que procesa Mercado Pago.",
    "naranja": "Sí, aceptamos Tarjeta Naranja a través de Mercado Pago.",
    "visa": "Sí, aceptamos Visa débito y crédito.",
    "mastercard": "Sí, aceptamos Mastercard.",
    "tarjetas": "Aceptamos Visa, Mastercard, Amex, Cabal y Naranja. 💳",
    "mercado pago": "Sí, podés usar dinero en cuenta de Mercado Pago sin problema.",
    "crypto": "¡Sí! Aceptamos USDT. Escribinos al WhatsApp para coordinar el pago crypto.",
    "usdt": "Aceptamos USDT por red TRC20 o BEP20. Hablanos al WhatsApp.",
    "bitcoin": "Por ahora solo USDT para evitar volatilidad, pero consultanos.",
    "alias": "Al elegir 'Transferencia' en el checkout te mostramos el Alias/CBU. Recordá enviar el comprobante.",
    "comprobante": "Es importante que mandes el comprobante por WhatsApp o respondas el mail para que procesemos tu pedido rápido.",
    "quiero comprar": "¡Genial! Elegí tus productos, agregalos al carrito y seguí los pasos. Es súper fácil.",
    "como compro": "Navegá por la tienda, seleccioná talle y color, y dale al botón 'Agregar al Carrito'. Después vas al carrito y finalizás la compra.",
    "pasos": "1. Elegís producto. 2. Carrito. 3. Completás datos. 4. Pagás. 5. ¡Listo! Te llega a tu casa.",

    // =============================================================================
    // 9. ESTILO Y CONSEJOS (STYLING)
    // =============================================================================
    "combinar": "La regla de oro: Si la parte de arriba es Oversize, la de abajo puede ser más recta (Cargo/Jean) para equilibrar. O todo ancho para full trap.",
    "outfit": "Te tiro un outfit ganador: Hoodie Negro + Cargo Beige + Zapas Jordan/Nike blancas. No falla nunca.",
    "colores": "Manejamos la paleta urbana: Black, Off-White, Grey, Sand, Military Green. Colores que no cansan.",
    "noche": "Para salir: Jean Roto + Remera Oversize con estampa en espalda + Accesorios (cadenas). Actitud pura.",
    "dia": "Para el día: Jogger Gris + Remera Blanca Lisa + Buzo atado a la cintura. Comodidad y facha.",
    "regalo": "Si es para regalar y no sabés el gusto exacto: Hoodie Negro Liso. Es el regalo más seguro del mundo.",
    "novio": "Para tu novio, un Cargo Negro o un Hoodie Oversize son regalos que no fallan.",
    "novia": "Para tu novia, un Hoodie bien amplio (que te va a robar después) es el mejor regalo.",
    "accesorios": "No te olvides de los accesorios. Un buen piluso (bucket hat) o unas medias altas cambian todo el look.",
    "zapatillas": "Nosotros no vendemos zapas (aún), pero nuestra ropa queda increíble con Jordan 1, Dunk, Forum o unas simples Vans Old Skool.",
    "moda": "El Streetwear no es una moda pasajera, es cultura. Nosotros te damos las herramientas, vos ponés el estilo.",
    "gorras": "Tenemos Caps y Pilusos. Son el toque final para cualquier outfit.",
    "medias": "Las medias altas son clave. Tenemos packs de 3 pares en blanco y negro.",
    "combos": "Fijate en la sección 'Combos'. Armamos packs de Hoodie + Pantalón con descuento.",
    "look": "Si querés un look 'Clean', andá por colores lisos y neutros. Si querés 'Hype', buscá nuestras estampas grandes.",

    // =============================================================================
    // 10. SOPORTE Y PROBLEMAS
    // =============================================================================
    "cambio": "Tenés 30 días para cambios. La prenda tiene que estar sin uso y con etiqueta. Escribinos por WhatsApp para coordinar.",
    "como cambio": "Para cambiar, escribinos al WhatsApp con tu número de orden. Si estás lejos, coordinamos el envío (el costo corre por tu cuenta salvo error nuestro).",
    "devolucion": "Si el producto tiene una falla (raro, pero puede pasar), te devolvemos el dinero o te mandamos uno nuevo al toque.",
    "reembolso": "Los reembolsos se hacen al mismo medio de pago que usaste. Tardan unos días en impactar según el banco.",
    "mi pedido": "¿No te llegó el tracking? Escribinos por WhatsApp con tu número de orden (#...) y te decimos dónde está.",
    "error": "Si la web te tira error, probá recargar o usar otro navegador. Si sigue, avisanos y te tomamos el pedido manual.",
    "tardo": "A veces el correo se demora en fechas clave (Hot Sale, Navidad). Te pedimos un poquito de paciencia, siempre llega.",
    "contacto": "El canal más rápido es WhatsApp. El ícono está abajo a la derecha. También respondemos MD de Instagram.",
    "ayuda": "Estoy acá para ayudarte. Decime qué necesitás: ¿Talles? ¿Envíos? ¿Recomendaciones?",
    "reclamo": "Si tuviste un problema, escribinos ya al WhatsApp. Lo vamos a solucionar. Tu satisfacción es lo primero.",
    "queja": "Lamentamos si algo salió mal. Por favor escribinos al WhatsApp para que podamos arreglarlo urgente.",
    "falla": "Revisamos todo antes de mandar, pero somos humanos. Si algo llegó mal, te lo cambiamos sin costo.",
    "cancelar": "Si querés cancelar una compra y todavía no se despachó, avisanos urgente por WhatsApp.",
    "modificar": "Si querés cambiar un talle o color de un pedido ya hecho, avisanos YA por WhatsApp antes de que salga el correo.",

    // =============================================================================
    // 11. EXTRAS Y CURIOSIDADES
    // =============================================================================
    "musica": "En el local suena Trap, Hip Hop y RKT. La música es parte de la cultura UrbanHustler.",
    "trap": "Nos copa el Trap argentino. Duki, YSY A, Neo... esa es la vibra.",
    "skate": "Nuestra ropa es apta para skate. Resistente y cómoda para tirar trucos.",
    "tatuajes": "Nuestra ropa luce mejor si tenés tatuajes... mentira, ¡le queda bien a todos! Pero el estilo va de la mano.",
    "futuro": "Se vienen cosas grandes. Nuevas telas, colaboraciones y quizás zapatillas. Quedate atento.",
    "competencia": "Respetamos a todos, pero nosotros hacemos lo nuestro. Nuestra calidad habla por sí sola.",
    "sorteo": "Sorteamos prendas todos los meses en Instagram. ¡Andá a seguirnos @UrbanHustler!",
    "modelo": "¿Querés ser modelo de la marca? Mandanos tus fotos y portfolio al mail o por MD. Siempre buscamos caras nuevas.",
    "lavado": "Lavá siempre con agua fría, del revés y no uses secadora. Así la ropa te dura años.",
    "cuidar": "No planches sobre la estampa. Lavá con colores similares. No uses lavandina.",
    "plancha": "Si planchás, que sea a temperatura media y nunca sobre la estampa directo.",
    "trabajar": "Si querés trabajar con nosotros, mandá tu CV al mail. A veces buscamos gente para el local o diseño.",
    "diseño": "Todo el diseño es propio. Nos inspiramos en la calle, la música y el arte.",
    
    // =============================================================================
    // 12. JERGA Y COLOQUIALISMOS (ARGENTINA)
    // =============================================================================
    "che": "¿Qué onda che? ¿En qué te ayudo?",
    "boludo": "Jaja, todo bien. ¿Qué necesitás?",
    "amigo": "¡Decime amigo! ¿Qué buscás hoy?",
    "facha": "Nuestra ropa te da +10 de facha instantánea. 😎",
    "pilcha": "Tenemos la mejor pilcha del condado. Mirá los Hoodies.",
    "alta ropa": "¡Gracias! Le metemos mucho amor a cada prenda.",
    "buenardo": "¡Viste! Está buenardo mal. 🔥",
    "nashe": "¡Nashe! 🍔 (Aunque eso ya pasó de moda, nuestra ropa no).",
    "god": "Nuestros precios y calidad son GOD. 🐐",
    "precio amigo": "El precio es el de la web, pero si pagás con transferencia tenés descuento de amigo (10% OFF).",
    "raton": "No seas ratón 🐭, invertí en calidad. Te va a durar años.",
    "caro": "La calidad tiene su precio. Usamos telas premium y confección de primera. No es ropa descartable.",
    "barato": "Tenemos precios justos para la calidad que ofrecemos. Y siempre hay ofertas en la sección Sale.",
    
    // =============================================================================
    // 13. RESPUESTA POR DEFECTO
    // =============================================================================
    "default": "¡Esa es una buena pregunta{name}! 🤔 Mi base de datos se está actualizando y no tengo la respuesta exacta ahora. \n\nPero probá preguntarme sobre:\n- 👕 **Productos** (Hoodies, Cargos)\n- 📏 **Talles**\n- 🚚 **Envíos**\n- 💳 **Pagos**\n\nO escribinos directo al WhatsApp para atención humana."
};

console.log("✅ Base de Conocimientos UrbanAI cargada: " + Object.keys(window.CHATBOT_DATA).length + " temas.");
