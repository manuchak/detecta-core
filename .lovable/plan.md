

## Diagnóstico actualizado: Bug real en creación de tickets

### Hallazgo del test en vivo

El fix anterior (nombre de tabla `categorias_ticket_custodio` → `ticket_categorias_custodio`) ya fue aplicado correctamente. Sin embargo, el error persiste por una **causa raíz diferente** en la base de datos.

### Error exacto (capturado del POST 400)

```text
{"code":"42703","details":null,"hint":null,"message":"record \"new\" has no field \"sla_deadline\""}
```

### Causa raíz

El trigger `auto_assign_and_set_sla` en la tabla `tickets` referencia `NEW.sla_deadline`, pero esa columna **no existe** en la tabla. Las columnas SLA reales son:
- `fecha_sla_respuesta`
- `fecha_sla_resolucion`

El trigger fue creado o modificado en algún momento sin alinear los nombres de columna con el esquema real.

### Fix requerido

**Migración SQL** para actualizar el trigger `auto_assign_and_set_sla`:

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_and_set_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_daniela_id uuid := 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca';
  v_sla_hours integer;
BEGIN
  -- Always assign to Daniela if not already assigned
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := v_daniela_id;
  END IF;

  -- Calculate SLA deadline based on priority
  v_sla_hours := CASE NEW.priority
    WHEN 'urgente' THEN 2
    WHEN 'alta' THEN 4
    WHEN 'media' THEN 8
    WHEN 'baja' THEN 24
    ELSE 8
  END;

  -- Use the actual column names from the tickets table
  IF NEW.fecha_sla_respuesta IS NULL THEN
    NEW.fecha_sla_respuesta := NOW() + (v_sla_hours || ' hours')::interval;
  END IF;

  IF NEW.fecha_sla_resolucion IS NULL THEN
    NEW.fecha_sla_resolucion := NOW() + ((v_sla_hours * 3) || ' hours')::interval;
  END IF;

  RETURN NEW;
END;
$function$;
```

Cambios:
- Reemplaza `NEW.sla_deadline` (inexistente) con `NEW.fecha_sla_respuesta` y `NEW.fecha_sla_resolucion` (columnas reales)
- `fecha_sla_respuesta` = tiempo de primera respuesta (basado en prioridad)
- `fecha_sla_resolucion` = tiempo de resolución (3x el de respuesta)

No se requieren cambios en el código frontend. Solo esta migración SQL.

