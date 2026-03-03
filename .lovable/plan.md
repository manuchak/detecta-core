

# Mejorar feedback UI del botón "Fix GEO"

## Problema
El botón "Fix GEO" ejecuta exitosamente (200 OK, toast "✅ 8 segmentos re-enriquecidos") pero la UI no cambia porque Mapbox devuelve exactamente las mismas distancias con los mismos waypoints. El usuario no tiene forma de saber que el fix no tuvo efecto real.

## Solución

Comparar distancias antes vs después del re-enriquecimiento y mostrar feedback diferenciado:

### Cambios en `SegmentAuditor.tsx`

1. **Guardar distancias pre-enrichment**: Antes de llamar al edge function, capturar las distancias actuales de los segmentos seleccionados.

2. **Comparar post-enrichment**: Después de invalidar queries y obtener nuevos datos, comparar distancias. Clasificar resultados en 3 categorías:
   - **Corregidos**: distancia cambió y ratio ahora < 2x → toast verde
   - **Actualizados sin efecto**: distancia cambió pero ratio sigue > 2x → toast amarillo
   - **Sin cambios**: misma distancia exacta → toast naranja explicativo

3. **Toast diferenciado**:
   - Si todos sin cambios: `"⚠️ 8 segmentos sin cambios — los waypoints producen la misma geometría. Requiere corrección manual de waypoints o calibración expectedRoadKm."`
   - Si algunos corregidos: `"✅ 3 corregidos, 5 sin cambios"`
   - Si todos corregidos: `"✅ 8 segmentos corregidos exitosamente"`

4. **Indicador visual post-fix**: Agregar un estado `lastFixResult` que marque temporalmente (5s) los segmentos que no cambiaron con un icono de "sin cambios" (⟳ tachado o similar) en la columna de status.

### Archivo a modificar
| Archivo | Cambio |
|---|---|
| `src/components/security/routebuilder/SegmentAuditor.tsx` | Lógica de comparación pre/post, toasts diferenciados, indicador visual temporal |

