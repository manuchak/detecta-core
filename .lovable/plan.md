

# Diagnóstico: Inconsistencia entre Coordinación C4 y Bitácora

## Problema raíz

La tabla `bitacora_asignaciones_monitorista` tiene **asignaciones activas para servicios ya completados**. Esto causa que:

- **C4 (Coordinador)** muestra a Karla con 9 servicios (cuenta todas las asignaciones activas)
- **Bitácora** muestra menos servicios porque filtra por `hora_fin_real IS NULL` y `estado != completado`
- El número no coincide entre vistas

### Datos concretos encontrados

| Servicio | Estado | hora_fin_real | Asignación activa? |
|----------|--------|---------------|-------------------|
| ASCAAST-1530 | completado | 2026-03-10 17:16 | Sí (Karla) — **BUG** |
| FAEAFCA-279 | completado | 2026-03-10 17:09 | Sí (Jose) — **BUG** |

Estos servicios terminados inflan el conteo del coordinador pero no aparecen en la bitácora.

### Causa: no hay garantía de limpieza

`liberarCustodio` sí desactiva asignaciones (líneas 507-511), pero si un servicio se completa por otra vía (planeación directa, otro módulo) o la desactivación falla silenciosamente, la asignación queda huérfana.

## Plan de corrección

### 1. Trigger PostgreSQL de limpieza automática
Crear un trigger `AFTER UPDATE` en `servicios_planificados` que, cuando `estado_planeacion` cambia a `completado` o `cancelado` (o `hora_fin_real` pasa de NULL a un valor), desactive automáticamente todas las asignaciones activas de ese `id_servicio`.

```sql
CREATE FUNCTION fn_cleanup_assignment_on_complete()
RETURNS trigger AS $$
BEGIN
  IF (NEW.estado_planeacion IN ('completado','cancelado') 
      OR (NEW.hora_fin_real IS NOT NULL AND OLD.hora_fin_real IS NULL)) THEN
    UPDATE bitacora_asignaciones_monitorista
    SET activo = false, fin_turno = now()
    WHERE servicio_id = NEW.id_servicio AND activo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Esto es la defensa definitiva: sin importar cómo se complete un servicio, la asignación se limpia.

### 2. Limpiar datos actuales
En la misma migración, ejecutar un UPDATE para desactivar las asignaciones huérfanas existentes.

### 3. C4 view: filtrar asignaciones de servicios completados
En `CoordinatorCommandCenter.tsx`, al construir `assignmentsByMonitorista` para las tarjetas, excluir asignaciones cuyo `servicio_id` corresponda a un servicio completado. Esto se puede hacer cruzando con los servicios del board (que ya excluyen completados).

### Archivos afectados
- **Nueva migración SQL**: trigger + limpieza de datos existentes
- `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx`: filtrar asignaciones de completados en el conteo

