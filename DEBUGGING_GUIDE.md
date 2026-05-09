# Guía de Debugging - Error de Cards

## Problema Resuelto
Cuando haces click en "Lo Quiero" de una card, la página muestra "Producto no encontrado".

## Cómo Verificar que Funciona

### 1. Abrir la Consola de Desarrollador
- **Windows/Linux**: Presiona `F12`
- **Mac**: `Cmd + Option + I`
- Ve a la pestaña **Console**

### 2. Verificar renderLatestDrops() en Home
1. Ve a `index.html` (la página home)
2. Abre la consola (F12)
3. Deberías ver logs similares a:

```
✅ Renderizando 8 productos con IDs:
  {id: 1, name: "Urban Hoodie Black"}
  {id: 2, name: "Cargo Pants Tactical"}
  ... etc
  Card 1: "Urban Hoodie Black" ID=1, href=detailProduct.html?id=1
  Card 2: "Cargo Pants Tactical" ID=2, href=detailProduct.html?id=2
  ... etc
✅ [renderLatestDrops] COMPLETADO - Cards renderizadas exitosamente en el DOM
```

Si NO ves estos logs significa que:
- **data.js no se cargó correctamente**
- **MOCK_DB no está disponible**
- **Hay un error en renderLatestDrops()**

Busca errores rojos en la consola que empiecen con ❌.

### 3. Hacer Click en "Lo Quiero"
1. En la home, haz click en el botón "Lo Quiero 🔥" de cualquier card
2. Se abrirá detailProduct.html?id=X (donde X es el ID del producto)
3. Abre la consola (F12) nuevamente
4. Deberías ver logs como:

```
🔍 [detailProduct] DOMContentLoaded disparado
🔍 [detailProduct] MOCK_DB disponible: true
🔍 [initDetailProduct] URL actual: http://localhost:5500/HTML/detailProduct.html?id=1
🔍 [initDetailProduct] Parámetro 'id' de la URL: 1
🔍 [initDetailProduct] productId parseado: 1 tipo: number
✅ Producto encontrado: Urban Hoodie Black
```

Si ves "Producto no encontrado" en lugar de esto, mira los logs rojos para encontrar el error.

## Checklist de Verificación

```
[ ] ¿MOCK_DB está disponible en home?
    → Busca: "✅ Usando MOCK_DB - Cantidad de productos: 8"

[ ] ¿Las 8 cards se renderizan?
    → Busca: "✅ Renderizando 8 productos"

[ ] ¿Cada card tiene un href correcto?
    → Busca: "detailProduct.html?id=X" para cada card

[ ] ¿Se carga detailProduct.html correctamente?
    → Busca: "🔍 [detailProduct] DOMContentLoaded"

[ ] ¿MOCK_DB está disponible en detailProduct?
    → Busca: "🔍 [detailProduct] MOCK_DB disponible: true"

[ ] ¿Se encuentra el producto?
    → Busca: "✅ Producto encontrado: [nombre]"
```

## Logs Esperados por Sección

### Home (index.html)
Cuando carga la página, deberías ver:
1. `⏳ Esperando a que MOCK_DB esté disponible...` (máx. 1-2 veces)
2. `✅ MOCK_DB está disponible, procediendo...`
3. `✅ Renderizando 8 productos...`
4. `✅ [renderLatestDrops] COMPLETADO`

### Detalle (detailProduct.html?id=X)
Cuando haces click en "Lo Quiero":
1. `🔍 [detailProduct] DOMContentLoaded`
2. `✅ MOCK_DB ya está disponible`
3. `🔍 [initDetailProduct] Buscando producto con ID: X`
4. `✅ Producto encontrado: [nombre]`

## Problemas Comunes y Soluciones

### Problema: "MOCK_DB no disponible"
**Causa**: data.js no se cargó correctamente
**Solución**:
- Verifica que data.js exista en JavaScript/
- Revisa la consola para errores en la carga de data.js

### Problema: "No hay productos después de aplicar filtros"
**Causa**: Todos los productos fueron filtrados y removidos
**Solución**:
- Cambia el filtro en home a "Todo"
- Verifica que las categorías sean válidas

### Problema: "Producto no encontrado. ID buscado: 1. BD tiene 0 productos"
**Causa**: MOCK_DB es un array vacío
**Solución**:
- Verifica que localStorage no tenga datos corruptos
- Limpia localStorage: `localStorage.clear()` en la consola
- Recarga la página

### Problema: Los logs no aparecen
**Causa**: La consola está filtrada o hay errores que detienen la ejecución
**Solución**:
- Abre la consola, va a "Settings" ⚙️ → "Show timestamps"
- Filtra por "renderLatestDrops" en el buscador de la consola
- Busca errores rojos que empiecen con ❌

## URLs Correctas

- **Home**: http://localhost:5500/HTML/index.html
- **Detalle**: http://localhost:5500/HTML/detailProduct.html?id=1
- **Catálogo**: http://localhost:5500/HTML/catalogo.html

## Si Aún No Funciona

1. Abre la consola (F12)
2. Copia TODO lo que ves (incluyendo errores)
3. Pégalo en un editor de texto
4. Revisa si hay patrones:
   - ❌ - Error crítico
   - ⚠️ - Advertencia (no es crítica)
   - 🔍 - Información de debugging
   - ✅ - Éxito

## Logs para El Error "Producto no encontrado"

Si ves exactamente este error en detailProduct.html:

```
⚠️ Producto no encontrado. ID buscado: 1. BD tiene 8 productos.
```

Significa que:
- ✅ MOCK_DB se cargó correctamente
- ✅ Hay 8 productos en la BD
- ❌ No se encontró el producto con ID=1

Posibles causas:
- El ID en la URL es incorrecto (verifica URL)
- Hay un problema con la comparación de IDs
- data.js tiene un problema

