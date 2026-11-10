/**
 * CATÁLOGO DE OPCIONES DEL ASISTENTE VIRTUAL
 * Toma automáticamente la dirección, horarios, WhatsApp e Instagram desde js/negocio.js.
 */
(function () {
    const info = window.NEGOCIO || {};
    const direccion = info.direccion || 'San Lorenzo 19';
    const ciudad = info.ciudad || 'Apóstoles, Misiones, Argentina';
    const horarios = info.horarios || '08:00 a 11:30 hs y 15:30 a 19:30 hs';
    const dias = info.diasAtencion || 'Lunes a Sábado';
    const whatsappNum = info.whatsapp || '5493758555948';
    const whatsappVisible = info.whatsappVisible || '3758-555948';
    const instagram = info.instagramUsuario || '@urbanhustler_indumentaria';
    const instagramUrl = info.instagramUrl || 'https://www.instagram.com/urbanhustler_indumentaria';

    window.CHATBOT_MENU = [
        {
            id: 'como-comprar',
            label: '¿Cómo comprar?',
            icon: 'fa-bag-shopping',
            answer: '1) Elegí la prenda y tu talle en la tienda.\n2) Agregala al carrito.\n3) Tocá "Finalizar por WhatsApp" para enviarnos tu pedido y coordinar pago y entrega al instante.',
            action: { label: 'Ver Colección', href: '/#productos-container' }
        },
        {
            id: 'envios',
            label: 'Envíos y entregas',
            icon: 'fa-truck-fast',
            answer: `Realizamos envíos a todo el país y entregas locales en ${ciudad}. Apenas enviás tu carrito por WhatsApp coordinamos el despacho.`
        },
        {
            id: 'pagos',
            label: 'Medios de pago',
            icon: 'fa-credit-card',
            answer: `Coordinamos el pago directamente por WhatsApp al confirmar tu pedido: aceptamos transferencia bancaria, efectivo en nuestro local (${direccion}) y medios vigentes.`
        },
        {
            id: 'talles',
            label: 'Talles y stock',
            icon: 'fa-ruler',
            answer: 'Dentro de la ficha de cada prenda vas a ver los talles disponibles y el stock en tiempo real. Si necesitás medidas exactas de ancho/largo, escribinos por WhatsApp.'
        },
        {
            id: 'calidad',
            label: 'Telas y calidad',
            icon: 'fa-shirt',
            answer: 'Trabajamos con algodón peinado 24/1 en remeras, frisa pesada en hoodies/buzos y denim/gabardina de alto gramaje en pantalones baggy, straight y cargo.'
        },
        {
            id: 'ubicacion',
            label: 'Local y horarios',
            icon: 'fa-location-dot',
            answer: `Nuestro local está en ${direccion} (${ciudad}).\nAtendemos ${dias} de ${horarios}.`,
            action: { label: 'Ver Mapa', href: '/#ubicacion-container' }
        },
        {
            id: 'cambios',
            label: 'Cambios de talle',
            icon: 'fa-rotate',
            answer: `Podés solicitar cambio de talle escribiéndonos por WhatsApp (${whatsappVisible}), siempre que la prenda esté sin uso y con su etiqueta original.`
        },
        {
            id: 'redes',
            label: 'Instagram oficial',
            icon: 'fa-brands fa-instagram',
            answer: `Seguinos en ${instagram} para ver ingresos anticipados, outfits y novedades.`,
            action: { label: 'Ir a Instagram', href: instagramUrl, external: true }
        },
        {
            id: 'whatsapp',
            label: 'Hablar por WhatsApp',
            icon: 'fa-brands fa-whatsapp',
            answer: `Escribinos directo al ${whatsappVisible} y nuestro equipo te asesora enseguida.`,
            action: { label: 'Abrir WhatsApp', href: `https://wa.me/${whatsappNum}`, external: true }
        }
    ];
})();
