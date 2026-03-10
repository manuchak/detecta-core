

# Filtrar custodios con indisponibilidades activas del flujo de asignacion

## Diagnostico

El RPC `get_custodios_activos_disponibles` filtra por `estado = 'activo' AND disponibilidad IN ('disponible', 'parcial')` pero **nunca consulta la tabla `custodio_indisponibilidades`**. Hay custodios como CHRISTIAN CANSECO, ANGEL JORDAN RODRIGUEZ MATEOS y otros con registros activos de indisponibilidad (falla mecanica, emergencia familiar, etc.) que siguen apareciendo como candidatos porque su `estado` sigue siendo `'activo'`.

Adicionalmente, hay registros de indisponibilidad con `fecha_fin_estimada` ya vencida (ej: Mar 5, Mar 8) pero `estado` sigue como `'activo'` en la tabla de indisponibilidades — nunca se cierran automaticamente.

## Solucion (2 cambios)

### 1. Migracion SQL: Actualizar RPC para excluir indisponibles

Agregar clausula `NOT EXISTS` al RPC `get_custodios_activos_disponibles`:

```sql
WHERE co.estado = 'activo'
  AND co.disponibilidad IN ('disponible', 'parcial')
  AND NOT EXISTS (
    SELECT 1 FROM custodio_indisponibilidades ci
    WHERE ci.custodio_id = co.id
      AND ci.estado = 'activo'
      AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > NOW())
  )
```

Esto elimina del listado a todo custodio con una indisponibilidad vigente.

### 2. Frontend safety net en `useProximidadOperacional.ts`

En el fallback (cuando el RPC falla y se usa query directa a `custodios_operativos`), agregar una query adicional a `custodio_indisponibilidades` para obtener los IDs de custodios con indisponibilidades activas vigentes, y filtrarlos del resultado.

Esto cubre el caso donde el RPC falla y el fallback no tiene la logica de exclusion.

### Impacto
- Custodios con falla mecanica, enfermedad, emergencia familiar, etc. dejan de aparecer en el flujo de asignacion
- Indisponibilidades ya vencidas no afectan (se ignoran por `fecha_fin_estimada > NOW()`)
- Sin cambios en la UI, solo en la fuente de datos

