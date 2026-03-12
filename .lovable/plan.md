

# Fix: Capacitación Presencial falla para candidatos armados

## Causa raíz encontrada

La tabla `progreso_capacitacion` tiene un **FK rígido** a `candidatos_custodios`:

```
progreso_capacitacion_candidato_id_fkey → candidatos_custodios(id) ON DELETE CASCADE
```

El candidato que Brenda intenta completar (`6144a47c`) es un **candidato armado** (tabla `candidatos_armados`). El storage upload funciona (hay 5 archivos subidos hoy), el registro en `documentos_candidato` se actualiza correctamente (el trigger `validate_candidato_id_both_tables` acepta ambas tablas), pero al intentar insertar en `progreso_capacitacion`, el FK falla con un error de foreign key violation.

**Evidencia**: 5 archivos en storage hoy para el mismo candidato, 0 registros en `progreso_capacitacion`, y el registro en `documentos_candidato` existe desde el 10 de marzo (se actualiza correctamente cada intento).

## Solución

### 1. Migración SQL: Relajar el FK para aceptar ambas tablas

Eliminar el FK actual y reemplazarlo con un trigger de validación similar al de `documentos_candidato`:

```sql
-- Quitar FK rígido
ALTER TABLE progreso_capacitacion DROP CONSTRAINT progreso_capacitacion_candidato_id_fkey;

-- Crear trigger que valide en ambas tablas
CREATE OR REPLACE FUNCTION validate_progreso_candidato_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_id
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_id
  ) THEN
    RAISE EXCEPTION 'candidato_id % not found in either table', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_progreso_candidato
  BEFORE INSERT OR UPDATE ON progreso_capacitacion
  FOR EACH ROW EXECUTE FUNCTION validate_progreso_candidato_id();
```

### 2. Código: Mejorar manejo de error duplicado en toast

En `handleMarcarManual` (TrainingTab.tsx), el error dispara **dos toasts** (uno del catch y otro del `onError` de la mutación). Eliminar el toast duplicado del catch.

## Archivos a modificar

| Cambio | Archivo |
|---|---|
| Migración SQL | Nueva migración para FK + trigger |
| Fix doble toast | `src/components/leads/evaluaciones/TrainingTab.tsx` |

