

# Fix: Cortes sin detalle ni valores — columna `cliente` no existe

## Causa raíz

En `useCxPCortesSemanales.ts` línea 121, la query de servicios selecciona el campo **`cliente`** que **no existe** en la tabla `servicios_custodia`. El campo correcto es **`nombre_cliente`**.

Supabase JS client falla silenciosamente (retorna `null` en `data` en lugar de lanzar excepción), así que el código salta todo el bloque de cálculo y crea el corte con 0 servicios, $0.00.

**Prueba directa**: Custodio "1011" (Sergio Montaño) tiene 7 servicios finalizados en la semana 02-08/Mar con $4,350 en costos base + $1,324 en casetas. Su corte se generó con $0.

## Cambio

| Archivo | Línea | Fix |
|---------|-------|-----|
| `useCxPCortesSemanales.ts` | 121 | Cambiar `cliente` → `nombre_cliente` en el `.select()` |
| `useCxPCortesSemanales.ts` | 134 | Cambiar `s.cliente` → `s.nombre_cliente` en la descripción del detalle |

## Después del fix

Los cortes ya generados con $0 están vacíos. Opciones:
1. Eliminar los cortes borrador con monto $0 y regenerarlos con "Generar Cortes Semana"
2. La protección de duplicados los bloqueará si no se eliminan primero — agregaré un query para limpiar los cortes vacíos automáticamente antes de regenerar (en el dialog masivo, excluir de `cortesSet` los que tienen `total_servicios = 0`)

Implementaré ambos: el fix de la columna + que el diálogo masivo ignore cortes vacíos (total_servicios=0) para permitir regenerarlos.

