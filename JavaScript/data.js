// Los productos ahora se gestionan 100% desde el Panel de Control y se guardan en Firebase/LocalStorage.
// Este array se mantiene vacío para evitar conflictos con productos viejos.
const MOCK_DB = [];

// Exponer globalmente explícitamente para evitar problemas de scope
window.MOCK_DB = MOCK_DB;