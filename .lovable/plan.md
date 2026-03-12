

# Bug: Armados liberados no aparecen en Planeación

## Problema

La función `liberar_custodio_a_planeacion_v2` inserta **siempre** en `custodios_operativos` y `pc_custodios`, incluso cuando el candidato es un armado (`v_is_armado = true`).

Sin embargo, el módulo de Planeación busca armados internos en la vista `armados_disponibles_extendido`, que lee de la tabla **`armados_operativos`** — una tabla completamente diferente.

Resultado: un armado liberado por Supply nunca aparece como armado interno asignable en Planeación.

## Cambio requerido

### Migración SQL: Actualizar `liberar_custodio_a_planeacion_v2`

Cuando `v_is_armado = true`, la función debe:

1. **Seguir insertando en `pc_custodios`** (registro de personal compartido, necesario para trazabilidad).
2. **Insertar en `armados_operativos`** en lugar de `custodios_operativos`, con:
   - `tipo_armado = 'interno'`
   - `estado = 'activo'`
   - `disponibilidad = 'disponible'`
   - `fuente = 'supply'`
   - Datos del candidato (nombre, teléfono, email, zona)
3. **No insertar en `custodios_operativos`** para armados (evitar duplicación en tabla incorrecta).

La lógica de búsqueda de existentes (paso 6) también debe bifurcarse: buscar en `armados_operativos` por `pc_custodio_id` o nombre/teléfono cuando es armado.

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | `CREATE OR REPLACE FUNCTION liberar_custodio_a_planeacion_v2` — bifurcar paso 6 para insertar en `armados_operativos` cuando `v_is_armado = true` |

No se requieren cambios en frontend — la vista `armados_disponibles_extendido` ya lee de `armados_operativos` con filtro `estado = 'activo' AND tipo_armado = 'interno'`.

