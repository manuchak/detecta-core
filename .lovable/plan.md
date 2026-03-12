

# Fix: RPC `liberar_custodio_a_planeacion_v2` no encuentra armados

## Problema
La función SQL `liberar_custodio_a_planeacion_v2` en el paso 3 (línea 49-51) busca el candidato **solo** en `candidatos_custodios`:

```sql
SELECT * INTO v_cand
FROM candidatos_custodios
WHERE id = v_lib.candidato_id;

IF v_cand IS NULL THEN
  -- 'Candidato no encontrado para este registro de liberación'
```

Para armados cuyo `candidato_id` apunta a `candidatos_armados`, siempre falla. Mismo patrón dual-table que hemos resuelto en FK de contratos, socioeconómico y capacitación.

## Cambio

### Migración SQL: Modificar `liberar_custodio_a_planeacion_v2`

Reemplazar el bloque de búsqueda del candidato (paso 3) con un lookup dual:

1. Intentar `candidatos_custodios` primero
2. Si no encuentra, intentar `candidatos_armados`
3. Solo fallar si no está en ninguna tabla

La estructura de ambas tablas comparte las columnas clave que usa la función: `nombre`, `telefono`, `email`, `vehiculo_propio`. Para armados, `vehiculo_propio` será `false` por defecto si la columna no existe o es null.

Además, ajustar el paso de `vehiculo_propio` (línea 69) para que cuando sea un armado sin vehículo, no bloquee por fase de vehículo incompleta.

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | `CREATE OR REPLACE FUNCTION liberar_custodio_a_planeacion_v2` con lookup dual en paso 3 |

