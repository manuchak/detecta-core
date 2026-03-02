

# Analisis de Performance y Error del Checklist de Custodios

## 1. Error de Hugo: "Error al capturar la foto. Intenta de nuevo."

### Causa raiz identificada

El error viene de `PhotoSlot.tsx` linea 61: `toast.error('Error al capturar la foto. Intenta de nuevo.')`. Este toast se dispara cuando `onCapture(angle, file)` lanza una excepcion. Rastreando la cadena, `onCapture` es `capturePhoto` en `useServiceChecklist.ts` (linea 157-244), que ejecuta esta secuencia:

```text
1. needsCompression(file) --> compressImage() --> Canvas API
2. getCurrentPositionSafe() --> GPS timeout 10s
3. savePhotoBlob() --> IndexedDB write
```

Los puntos de fallo probables (en orden de probabilidad):

| Causa | Probabilidad | Evidencia |
|-------|-------------|-----------|
| **Compresion de imagen falla en dispositivo legacy** | Alta | La compresion usa Canvas API con timeouts de 8s (img.onload) y 5s (toBlob). En telefonos Android de gama baja, `toBlob` puede fallar silenciosamente o el timeout de 8s para cargar la imagen no es suficiente |
| **GPS timeout de 10s** | Media | `getCurrentPositionSafe` espera hasta 10s. No deberia lanzar error (retorna null), pero si el dispositivo tiene GPS problematico podria causar un error no manejado |
| **IndexedDB quota exceeded** | Baja-Media | Si Hugo ya tiene fotos de servicios anteriores sin sincronizar, el storage podria estar lleno. `savePhotoBlob` no tiene try/catch propio |
| **Blob de 0 bytes post-compresion** | Baja | El codigo ya valida esto (linea 179) y lanza error explicito, pero el toast generico lo oculta |

### Solucion propuesta

Mejorar el manejo de errores en `capturePhoto` para:
- Diferenciar el tipo de error y mostrar un mensaje especifico (no generico)
- Agregar fallback: si la compresion falla, usar el archivo original
- Agregar logging estructurado para diagnostico remoto
- Manejar quota de IndexedDB con limpieza automatica

## 2. Analisis de Performance y Adopcion (< 60%)

### Problemas identificados que impactan la adopcion

#### A. Flujo demasiado largo y bloqueante

El wizard tiene 4 pasos OBLIGATORIOS en secuencia estricta:
1. **Documentos** — Bloquea si hay documentos vencidos/rechazados/faltantes (linea 46). El custodio NO puede hacer el checklist si no tiene 3 documentos vigentes. Esto es un muro para custodios nuevos o con documentacion pendiente.
2. **Inspeccion** — 11 items (6 vehiculo + 4 equipamiento + combustible). Cada uno requiere interaccion manual.
3. **Fotos** — 4 fotos obligatorias. Cada una dispara compresion + GPS. En un telefono lento, cada foto puede tardar 8-13 segundos en procesarse.
4. **Firma** — Requiere firma digital.

**Tiempo estimado en dispositivo lento: 5-8 minutos.** Los custodios tienen prisa antes de un servicio.

#### B. Compresion sincrona y bloqueo de UI

Cuando el custodio toma una foto:
1. `compressImage` ejecuta en el hilo principal (Canvas API)
2. El spinner aparece pero la UI puede congelarse 3-5s en Android gama baja
3. Simultaneamente, `getCurrentPositionSafe` espera hasta 10s por GPS
4. Total: el custodio puede esperar hasta 15s por foto sin feedback claro

#### C. Sin indicador de progreso real

El spinner de `PhotoSlot` (linea 129-131) solo muestra una animacion generica. No indica "Comprimiendo...", "Obteniendo GPS...", "Guardando...". El custodio no sabe si la app esta trabajando o se colgó.

#### D. Error handling opaco

Todos los errores muestran el mismo toast generico: "Error al capturar la foto. Intenta de nuevo." Sin distincion entre:
- Camara denegada por el navegador
- Compresion fallida
- Storage lleno
- GPS no disponible (que no deberia ser error)

#### E. Sin recuperacion parcial visible

Si el custodio cierra la app a mitad del paso 3 (fotos), el borrador se guarda en IndexedDB. Pero cuando regresa, el wizard restaura el paso pero los blobs de fotos pueden haberse perdido si el navegador limpio IndexedDB (comun en iOS Safari con storage pressure).

#### F. Dependencia de `capture="environment"` 

El atributo `capture="environment"` funciona de forma inconsistente entre navegadores moviles. En algunos Android WebView, no abre la camara sino el selector de archivos, y en otros directamente falla silenciosamente.

### Mejoras propuestas para adopcion

#### Prioridad 1 — Errores y estabilidad (impacto inmediato)

**1.1 Mensajes de error especificos en `capturePhoto`**

Envolver cada fase (compresion, GPS, IndexedDB) en try/catch individuales con mensajes descriptivos:
- "No se pudo comprimir la foto. Usando imagen original."
- "GPS no disponible, la foto se guardará sin ubicacion."
- "Almacenamiento lleno. Intenta liberar espacio o sincroniza tus checklists pendientes."

**1.2 Fallback robusto en compresion**

Si `compressImage` falla, usar el archivo original SIN lanzar error. Actualmente hay un `console.warn` (linea 174) pero si el error es en el bloque anterior (linea 163-176), el catch no cubre todos los casos.

**1.3 Limpiar fotos de servicios anteriores**

Antes de iniciar un nuevo checklist, verificar si hay blobs huerfanos en IndexedDB de servicios ya sincronizados y limpiarlos automaticamente.

#### Prioridad 2 — Velocidad percibida

**2.1 Feedback progresivo en captura de foto**

Reemplazar el spinner generico con estados secuenciales:
- "Procesando foto..." (compresion)
- "Obteniendo ubicacion..." (GPS)  
- "Guardando..." (IndexedDB)

**2.2 GPS en paralelo con compresion**

Actualmente la secuencia es: compresion LUEGO GPS. Ejecutarlos con `Promise.all` para ahorrar hasta 10s por foto.

**2.3 Reducir threshold de compresion**

Actualmente comprime si > 500KB. Las fotos de camaras modernas son 3-8MB. La compresion SIEMPRE se ejecuta. Considerar usar `createImageBitmap` (mas rapido que Image + Canvas en Android) como metodo primario.

#### Prioridad 3 — Reducir friccion del flujo

**3.1 Hacer el paso de Documentos no-bloqueante**

Mostrar advertencia pero permitir continuar. Los documentos se pueden verificar despues. La mayoria de custodios abandonan en el paso 1 porque tienen un documento vencido y no pueden avanzar.

**3.2 Auto-guardado inmediato de fotos**

Guardar cada foto en IndexedDB inmediatamente despues de captura, no esperar al auto-save de 30s.

## Archivos a modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/hooks/useServiceChecklist.ts` | Errores especificos en capturePhoto, GPS paralelo a compresion, limpieza de blobs huerfanos | P1 |
| `src/components/custodian/checklist/PhotoSlot.tsx` | Feedback progresivo (estados de captura), mensajes de error diferenciados | P1 |
| `src/lib/imageUtils.ts` | Fallback mas robusto: si compresion falla, retornar archivo original como blob | P1 |
| `src/components/custodian/checklist/StepDocuments.tsx` | Hacer documentos no-bloqueante (advertencia pero permite continuar) | P3 |

## Resumen ejecutivo

El error de Hugo es muy probablemente un fallo de la **compresion de imagen** en su dispositivo (Canvas API timeout o toBlob fallando). La baja adopcion (< 60%) se debe a una combinacion de:

1. **Errores silenciosos** que frustran sin dar contexto
2. **Flujo demasiado largo** (5-8 min) para un custodio con prisa
3. **Bloqueo en paso 1** por documentacion — el problema mas grave para adopcion
4. **Lentitud percibida** por operaciones secuenciales (compresion + GPS) sin feedback

Las correcciones de Prioridad 1 atacan directamente el error de Hugo y los errores mas comunes. Las de Prioridad 2-3 mejoran la experiencia para subir la tasa de adopcion.

