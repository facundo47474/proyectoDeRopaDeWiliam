/**
 * CONFIGURACIÓN CENTRAL DEL NEGOCIO
 * Edita este archivo para cambiar teléfonos, dirección, horarios o redes en toda la tienda.
 */
window.NEGOCIO = {
    nombre: 'UrbanHustler',
    lema: 'Viste tu identidad.',
    urlSitio: 'https://urbanhustler.vercel.app',

    // Contacto y redes
    whatsapp: '5493758555948',
    whatsappVisible: '3758-555948',
    correo: 'contacto@urbanhustler.com.ar',
    instagramUsuario: '@urbanhustler_indumentaria',
    instagramUrl: 'https://www.instagram.com/urbanhustler_indumentaria',

    // Ubicación y horarios del local
    direccion: 'San Lorenzo 19',
    ciudad: 'Apóstoles, Misiones, Argentina',
    diasAtencion: 'Lunes a Sábado',
    horarios: '08:00 a 11:30 hs y 15:30 a 19:30 hs',

    // Servicios externos
    googleClientId: '543305563101-jdvoskcnplk9tguiqbgt2g68snd7mlk0.apps.googleusercontent.com',
    cloudinary: {
        cloudName: 'hurbanhustler',
        uploadPreset: 'urban_uploads',
        carpeta: 'urban_hustler_products'
    },

    // Correos autorizados para el panel de administración
    administradores: [
        'gimenez.william07@gmail.com',
        'facundotomas018@gmail.com'
    ],

    // Categorías iniciales por defecto
    categoriasBase: [
        { id: 'hoodie', name: 'Hoodie' },
        { id: 'pants', name: 'Pantalones' },
        { id: 'tshirt', name: 'Remeras' },
        { id: 'accessories', name: 'Accesorios' }
    ]
};

// Mantener variable global vacía por compatibilidad
window.MOCK_DB = [];

