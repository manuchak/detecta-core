
# Fix: Fotos de 0 bytes en checklist - Validacion, indicador visual y prevencion

## Problema
Se detectaron 11 de 565 archivos (2%) en el bucket `checklist-evidencias` con tamano de 0 bytes. Esto causa imagenes rotas en el modal de monitoreo. La causa raiz es que el blob puede llegar vacio desde IndexedDB (presion de memoria en Android o race condition en canvas.toBlob) y el sistema sube el archivo sin validar su tamano.

## Cambios

### 1. Validacion pre-upload en `useServiceChecklist.ts` (lineas 284-303)

Antes de llamar a `supabase.storage.upload`, validar que `localPhoto.blob.size > 0`:

- Si el blob es 0 bytes, intentar re-leer desde IndexedDB (retry)
- Si el retry tambien devuelve 0 bytes, marcar la foto como fallida con un toast de error al custodio, y NO subirla a storage
- Si el retry funciona, usar el blob re-leido normalmente

Esto previene que se suban archivos vacios en el futuro.

### 2. Indicador visual en `ChecklistDetailModal.tsx` (lineas 224-250)

En la grilla de fotos del modal de monitoreo:

- Si `foto.url` es falsy (undefined/null), mostrar un placeholder con icono de AlertTriangle, texto "Archivo corrupto" y "0 bytes" en vez de un `<img>` roto
- Si `foto.url` existe pero la imagen falla al cargar (onError), mostrar un fallback "Error de carga"
- Las fotos corruptas no abren el lightbox (disabled)

### 3. Validacion en `capturePhoto` (linea 156-236 del mismo hook)

Agregar validacion despues de la compresion: si el `processedFile.size === 0`, rechazar la captura con toast de error al custodio para que reintente la foto inmediatamente, en lugar de guardar un blob vacio en IndexedDB.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useServiceChecklist.ts` | Validacion blob.size > 0 en upload (linea 284) + validacion post-compresion en capturePhoto (linea 170) |
| `src/components/monitoring/checklist/ChecklistDetailModal.tsx` | Indicador "Archivo corrupto" para fotos sin URL o con error de carga (linea 224) |

## Sin cambios en
- Logica de compresion (`imageUtils.ts`) - ya tiene fallbacks robustos
- Schema de base de datos
- Triggers o RLS
