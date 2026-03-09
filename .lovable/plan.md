

# Fix: Error al Generar Cortes Masivos

## Causa Raíz

El campo `operativo_id` en la tabla `cxp_cortes_semanales` es tipo **uuid**, pero los valores de `id_custodio` en `servicios_custodia` son strings numéricos (ej. "1004", "1279"). Al insertar, Postgres rechaza el cast `"1279" → uuid` y lanza error para cada custodio.

Esto explica los **8 errores** visibles en el screenshot — son los custodios cuyos IDs no pueden convertirse a UUID.

## Solución

Cambiar la columna `operativo_id` de `uuid` a `text`. Esto es correcto porque:
- Los IDs de custodios son códigos numéricos heredados, no UUIDs
- No existe FK a `candidatos_custodios` (los IDs no coinciden)
- El campo `operativo_nombre` ya identifica al operativo de forma legible

### Cambios

| Recurso | Acción |
|---------|--------|
| **Migración SQL** | `ALTER TABLE cxp_cortes_semanales ALTER COLUMN operativo_id TYPE text;` |
| `GenerarCortesMasivosDialog.tsx` | Fix: agregar `key` a los Fragment del `.map()` (warning de React en consola) |

### Detalle técnico

1. **Migración**: Cambiar tipo de `operativo_id` de `uuid` a `text`. No hay constraints ni FKs que bloqueen.
2. **React key warning**: En línea 288, el `<>` Fragment dentro del `.map()` necesita ser `<Fragment key={op.id}>` para evitar el warning de keys.
3. No se requieren cambios en `useCxPCortesSemanales.ts` — la lógica de insert ya pasa strings, solo falla por el tipo de columna.

