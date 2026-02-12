

## Fix: Agregar compresion de imagenes al flujo de documentos del custodio

### Diagnostico

La compresion de imagenes funciona correctamente para las **fotos del checklist** (vehiculo) - estas llegan a 111-278 KB como se esperaba. El problema esta en las **fotos de documentos** (licencia, circulacion, seguro) que se suben SIN compresion:

| Tipo | Tamano promedio | Compresion? |
|---|---|---|
| Fotos vehiculo (checklist) | 111-278 KB | SI - via `useServiceChecklist.ts` |
| Fotos documentos (onboarding) | 2.3-5.2 MB | NO - `useCustodianDocuments.ts` sube raw |

La funcion `compressImage()` en `imageUtils.ts` esta probada y funciona bien (v6 con timeouts y fallbacks). Simplemente no se invoca en el flujo de documentos.

### Solucion

**Archivo unico: `src/hooks/useCustodianDocuments.ts`**

Agregar compresion antes del upload en la `mutationFn`, reutilizando las mismas utilidades que ya usa el checklist:

1. Importar `compressImage` y `needsCompression` de `@/lib/imageUtils`
2. Antes de la linea de upload (linea 76), agregar bloque de compresion:
   - Si `needsCompression(file)` (>500KB), comprimir con `compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.7 })`
   - Usar el blob comprimido para el upload
   - Si la compresion falla, usar el archivo original (fallback seguro - misma logica que el checklist)
3. Actualizar el `contentType` del upload para usar `image/jpeg` cuando se comprime

### Riesgo y mitigacion

- **Riesgo CERO de romper funcionalidad existente**: el patron es identico al que ya funciona en `useServiceChecklist.ts` (lineas 159-172)
- Fallback al archivo original si la compresion falla por cualquier razon
- No se modifica ningun otro archivo ni flujo
- La compresion usa Canvas API nativa del navegador, sin dependencias adicionales

### Resultado esperado

Las fotos de documentos bajaran de ~3 MB a ~400-500 KB (reduccion del 80%), igual que las fotos del checklist. Esto reduce:
- Tiempo de upload (critico en redes moviles lentas)
- Consumo de storage en Supabase
- Riesgo de timeouts durante la subida

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/hooks/useCustodianDocuments.ts` | Agregar compresion antes de upload (~10 lineas nuevas) |

