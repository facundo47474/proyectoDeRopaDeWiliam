/**
 * GESTOR DE BASE DE DATOS (Firebase Firestore, Auth y Storage)
 * Conecta la tienda y el panel administrativo con la nube.
 */
class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (window.firebase && window.firebase.apps) {
            this.initializeConfig();
            return;
        }

        try {
            await this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
            await Promise.all([
                this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'),
                this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'),
                this.loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js')
            ]);
            this.initializeConfig();
        } catch (error) {
            console.error('❌ Error cargando librerías de Firebase:', error);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeConfig() {
        const firebaseConfig = {
            apiKey: 'AIzaSyAG2an8MiIjLbIxGgJQn36Jf6zpT93fgYY',
            authDomain: 'urbanhustler-15d31.firebaseapp.com',
            projectId: 'urbanhustler-15d31',
            storageBucket: 'urbanhustler-15d31.firebasestorage.app',
            messagingSenderId: '753692866178',
            appId: '1:753692866178:web:64ae1aa4e783f73a3ea69b',
            measurementId: 'G-FNG4JM59HR'
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        try {
            this.auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
            this.db = typeof firebase.firestore === 'function' ? firebase.firestore() : null;
            this.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
        } catch (error) {
            console.error('❌ Error al inicializar servicios de Firebase:', error);
        }

        if (this.db) {
            try {
                this.db.enablePersistence({ synchronizeTabs: false }).catch(() => {});
            } catch (e) {}
        }

        this.isInitialized = true;
        document.dispatchEvent(new Event('firebase-ready'));
    }

    async waitForDb() {
        if (this.db) return true;
        for (let i = 0; i < 30; i++) {
            if (this.db) return true;
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    }

    async signInWithGoogle(idToken) {
        if (!this.auth) return;
        try {
            const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
            await this.auth.signInWithCredential(credential);
        } catch (error) {
            console.error('Error en Firebase Auth:', error);
        }
    }

    async saveUser(user) {
        if (!await this.waitForDb() || !user?.email) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('users').doc(user.email).set(user, { merge: true });
            return { ok: true };
        } catch (e) {
            console.error('Error guardando usuario:', e);
            return { ok: false, error: e.message };
        }
    }

    async saveOrder(order) {
        if (!await this.waitForDb() || !order?.id) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('orders').doc(String(order.id)).set(order);
            return { ok: true };
        } catch (e) {
            console.error('Error guardando pedido:', e);
            return { ok: false, error: e.message };
        }
    }

    async updateOrder(id, partialData) {
        if (!await this.waitForDb() || !id) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('orders').doc(String(id)).set(partialData, { merge: true });
            return { ok: true };
        } catch (e) {
            console.error('Error actualizando pedido:', e);
            return { ok: false, error: e.message };
        }
    }

    async deleteOrder(id) {
        if (!await this.waitForDb()) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('orders').doc(String(id)).delete();
            return { ok: true };
        } catch (e) {
            console.error('Error eliminando pedido:', e);
            return { ok: false, error: e.message };
        }
    }

    async saveProduct(product) {
        if (!await this.waitForDb() || !product?.id) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('products').doc(String(product.id)).set(product);
            return { ok: true };
        } catch (e) {
            console.error('Error guardando producto:', e);
            return { ok: false, error: e.message };
        }
    }

    async deleteProduct(id) {
        if (!await this.waitForDb()) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('products').doc(String(id)).delete();
            return { ok: true };
        } catch (e) {
            console.error('Error eliminando producto:', e);
            return { ok: false, error: e.message };
        }
    }

    async saveCategories(categories) {
        if (!await this.waitForDb() || !Array.isArray(categories)) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('settings').doc('categories').set({ items: categories, updatedAt: new Date().toISOString() });
            return { ok: true };
        } catch (e) {
            console.warn('No se pudieron sincronizar categorías en la nube:', e);
            return { ok: false, error: e.message };
        }
    }

    async getCategories() {
        const defaults = window.NEGOCIO?.categoriasBase || [
            { id: 'hoodie', name: 'Hoodie' },
            { id: 'pants', name: 'Pantalones' },
            { id: 'tshirt', name: 'Remeras' },
            { id: 'accessories', name: 'Accesorios' }
        ];

        if (await this.waitForDb()) {
            try {
                const doc = await this.db.collection('settings').doc('categories').get();
                if (doc.exists && Array.isArray(doc.data()?.items) && doc.data().items.length > 0) {
                    localStorage.setItem('urbanHustlerCategories', JSON.stringify(doc.data().items));
                    return doc.data().items;
                }
            } catch (e) {}
        }

        try {
            const local = JSON.parse(localStorage.getItem('urbanHustlerCategories'));
            if (Array.isArray(local) && local.length > 0) return local;
        } catch (e) {}

        localStorage.setItem('urbanHustlerCategories', JSON.stringify(defaults));
        return defaults;
    }

    async saveShippingConfig(config) {
        const normalizado = typeof window.normalizarShippingConfig === 'function'
            ? window.normalizarShippingConfig(config)
            : config;
        const payload = { ...normalizado, updatedAt: new Date().toISOString() };

        try {
            localStorage.setItem('urbanHustlerShippingConfig', JSON.stringify(payload));
        } catch (e) {}

        if (!await this.waitForDb()) return { ok: false, error: 'Sin conexión a base de datos' };
        try {
            await this.db.collection('settings').doc('shipping').set(payload);
            return { ok: true };
        } catch (e) {
            console.warn('No se pudieron sincronizar tarifas de envío en la nube:', e);
            return { ok: false, error: e.message };
        }
    }

    async getShippingConfig() {
        const normalizar = (raw) => typeof window.normalizarShippingConfig === 'function'
            ? window.normalizarShippingConfig(raw)
            : (raw || window.SHIPPING_DEFAULTS);

        if (await this.waitForDb()) {
            try {
                const doc = await this.db.collection('settings').doc('shipping').get();
                if (doc.exists && doc.data()) {
                    const cfg = normalizar(doc.data());
                    try {
                        localStorage.setItem('urbanHustlerShippingConfig', JSON.stringify(cfg));
                    } catch (e) {}
                    return cfg;
                }
            } catch (e) {}
        }

        try {
            const local = JSON.parse(localStorage.getItem('urbanHustlerShippingConfig'));
            if (local && typeof local === 'object') return normalizar(local);
        } catch (e) {}

        return normalizar(null);
    }

    async getCollection(collectionName) {
        if (!await this.waitForDb()) return null;
        try {
            const snapshot = await this.db.collection(collectionName).get();
            return snapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error(`Error leyendo ${collectionName}:`, e);
            return null;
        }
    }
}

window.firebaseManager = new FirebaseManager();

