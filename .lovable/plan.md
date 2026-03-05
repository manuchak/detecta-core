

# Fix: Error "record new has no field servicio_custodia_id"

## Root Cause

The trigger `trigger_calcular_duracion_real` fires on every UPDATE to `servicios_planificados`. Its function `calcular_duracion_real` references `NEW.servicio_custodia_id`, but that column does not exist on `servicios_planificados`. When the zombie cleanup function updates `hora_fin_real`, this trigger fires and crashes.

## Fix

Update the `calcular_duracion_real` trigger function to safely check if the column context exists, or simply skip the `servicios_custodia` update when `servicio_custodia_id` is not available. The cleanest fix is to guard the logic with a check:

### SQL Migration

```sql
CREATE OR REPLACE FUNCTION public.calcular_duracion_real()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hora_inicio_real IS NOT NULL AND NEW.hora_fin_real IS NOT NULL THEN
    -- Only update servicios_custodia if the table has a matching record by id_servicio
    UPDATE servicios_custodia
    SET duracion_servicio = (NEW.hora_fin_real - NEW.hora_inicio_real)
    WHERE servicio_planificado_id = NEW.id
      AND duracion_servicio IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
```

Before writing the final SQL, I need to verify how `servicios_custodia` links to `servicios_planificados` (what FK column name exists).

| Step | Detail |
|---|---|
| 1 | Query `servicios_custodia` columns to find the correct FK column |
| 2 | Update the trigger function to use the correct join column |
| Single migration | One `CREATE OR REPLACE FUNCTION` statement |

