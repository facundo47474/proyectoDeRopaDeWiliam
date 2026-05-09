/**
 * FirebaseManager
 * Gestiona la conexión a la base de datos en la nube (Firestore).
 * Permite que los datos sean reales y compartidos entre dispositivos.
 */
class FirebaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.firebase) {
            this.initializeConfig();
            return;
        }

        console.log("🔥 Cargando Firebase...");
        // Cargar SDKs de Firebase dinámicamente desde CDN (Versión Compat para Vanilla JS)
        // 1. Cargar primero el core (app-compat) para evitar errores de dependencia (INTERNAL)
        await this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
        
        await Promise.all([
            this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'),
            this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'),
            this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js')
        ]);

        // await this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js');

        this.initializeConfig();
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeConfig() {
        // --- CONFIGURACIÓN DE TU PROYECTO FIREBASE ---
        const firebaseConfig = {
            apiKey: "AIzaSyAG2an8MiIjLbIxGgJQn36Jf6zpT93fgYY",
            authDomain: "urbanhustler-15d31.firebaseapp.com",
            projectId: "urbanhustler-15d31",
            storageBucket: "urbanhustler-15d31.firebasestorage.app",
            messagingSenderId: "753692866178",
            appId: "1:753692866178:web:64ae1aa4e783f73a3ea69b",
            measurementId: "G-FNG4JM59HR"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        try {
            // Inicializar servicios con verificaciones de seguridad
            this.auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
            this.db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
            this.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
            
            if (!this.db) console.warn("⚠️ Firebase Firestore no pudo inicializarse correctamente.");
            if (!this.storage) console.warn("⚠️ Firebase Storage no pudo inicializarse correctamente.");
        } catch (error) { console.error("❌ Error al inicializar servicios de Firebase:", error); }
        
        // MEJORA: Habilitar persistencia offline para evitar errores por timeout de red
        if (this.db) {
            try {
                this.db.enablePersistence({ synchronizeTabs: false }).catch(err => {
                    if (err.code === 'failed-precondition') console.warn("⚠️ Persistencia: Múltiples pestañas abiertas.");
                    else if (err.code === 'unimplemented') console.warn("⚠️ Persistencia: Navegador no soportado.");
                });
            } catch (e) { console.warn("Persistence ignore"); }
        }

        this.isInitialized = true;
        console.log("🔥 Firebase conectado y listo.");

        // Notificar al sistema que la BD está lista
        document.dispatchEvent(new Event('firebase-ready'));
    }

    // --- AUTENTICACIÓN ---
    async signInWithGoogle(idToken) {
        if (!this.auth) return;
        try {
            const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
            await this.auth.signInWithCredential(credential);
            console.log("🔥 Firebase Auth: Sesión iniciada y segura.");
        } catch (error) {
            console.error("Error en Firebase Auth:", error);
        }
    }

    // --- MÉTODOS DE AYUDA PARA GUARDAR/LEER DATOS ---

    // Esperar a que la DB esté lista (Pequeño helper interno)
    async waitForDb() {
        if (this.db) return true;
        // Esperar hasta 3 segundos
        for (let i = 0; i < 30; i++) {
            if (this.db) return true;
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    }

    async saveUser(user) {
        if (!await this.waitForDb()) return;
        try {
            // Usamos el email como ID para evitar duplicados
            await this.db.collection('users').doc(user.email).set(user, { merge: true });
            console.log("☁️ Usuario guardado en nube:", user.email);
        } catch (e) {
            console.error("Error guardando usuario en nube:", e);
        }
    }

    async saveOrder(order) {
        if (!await this.waitForDb()) return;
        try {
            // Guardar orden con ID generado por timestamp (convertido a string)
            await this.db.collection('orders').doc(String(order.id)).set(order);
            console.log("☁️ Orden guardada en nube:", order.id);
        } catch (e) {
            console.error("Error guardando orden en nube:", e);
        }
    }

    async saveProduct(product) {
        if (!await this.waitForDb()) return;
        try {
            await this.db.collection('products').doc(String(product.id)).set(product);
            console.log("☁️ Producto guardado en nube:", product.name);
        } catch (e) {
            console.error("Error guardando producto:", e);
        }
    }

    async deleteProduct(id) {
        if (!await this.waitForDb()) return;
        try {
            await this.db.collection('products').doc(String(id)).delete();
            console.log("☁️ Producto eliminado de nube:", id);
        } catch (e) { console.error(e); }
    }

    async deleteOrder(id) {
        if (!await this.waitForDb()) return;
        try {
            await this.db.collection('orders').doc(String(id)).delete();
            console.log("☁️ Orden eliminada de nube:", id);
        } catch (e) { console.error("Error eliminando orden:", e); }
    }

    // --- GESTIÓN DE COMENTARIOS (EXPERIENCIA) ---
    async saveComment(comment) {
        if (!await this.waitForDb()) return;
        try {
            await this.db.collection('comments').doc(String(comment.id)).set(comment);
            console.log("☁️ Comentario guardado en nube:", comment.id);
        } catch (e) {
            console.error("Error guardando comentario:", e);
        }
    }

    async deleteComment(id) {
        if (!await this.waitForDb()) return;
        try {
            await this.db.collection('comments').doc(String(id)).delete();
            console.log("☁️ Comentario eliminado de nube:", id);
        } catch (e) { console.error("Error eliminando comentario:", e); }
    }

    // Métodos de Lectura (Devuelven Promesas)
    async getCollection(collectionName) {
        if (!await this.waitForDb()) return [];
        try {
            const snapshot = await this.db.collection(collectionName).get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error(`Error leyendo ${collectionName}:`, e);
            // Si hay un problema de permisos o red, marcamos como no inicializado para evitar loops de errores
            if (e.code === 'permission-denied' || e.code === 'unavailable') {
                this.isInitialized = false;
            }
            return null; // Retornar null para indicar fallo y no sobrescribir local
        }
    }

    // --- GESTIÓN DE ARCHIVOS (STORAGE) ---
    async uploadImage(file) {
        if (!await this.waitForDb() || !this.storage) {
            console.error("Storage no inicializado");
            return null;
        }
        
        // --- MEJORA: Nombre de archivo robusto para archivos comprimidos (WebP) ---
        // 1. Quitar extensión original para evitar nombres como "imagen.png.webp"
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.') || file.name;
        // 2. Limpiar caracteres especiales del nombre
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '_');
        // 3. Determinar la extensión final correcta
        const extension = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg');

        // 4. Crear un nombre de archivo único y limpio
        const fileName = `product_images/${Date.now()}-${sanitizedName}.${extension}`;
        const storageRef = this.storage.ref(fileName);

        try {
            // Subir el archivo
            const snapshot = await storageRef.put(file);
            // Obtener la URL de descarga pública
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log(`☁️ Imagen subida: ${fileName}`);
            return downloadURL;
        } catch (e) {
            console.error("❌ Error subiendo imagen a Storage:", e);
            // Detección de error por CORS
            if (e.code === 'storage/unknown' || e.code === 'storage/retry-limit-exceeded' || e.message.includes('network')) {
                console.error("🚨 BLOQUEO CORS DETECTADO: Necesitas configurar CORS en tu bucket de Firebase.");
                alert("Error de permisos en la Nube (CORS). Revisa la consola para ver la solución.");
            }
            return null;
        }
    }
}

// Inicializar globalmente
window.firebaseManager = new FirebaseManager();
