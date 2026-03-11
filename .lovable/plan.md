

# Bug: Equipo supply no puede guardar nada — FK violation con candidatos armados

## Causa raíz encontrada

En los logs de Postgres hay **6 errores recientes** de FK violation:

```
insert or update on table "evaluaciones_toxicologicas" violates foreign key constraint
"evaluaciones_toxicologicas_candidato_id_fkey"
```

**SERGIO ZUÑIGA BALANZAR** (el candidato del screenshot) existe **solo en `candidatos_armados`**, NO en `candidatos_custodios`.

Todas las tablas de evaluación tienen FK exclusivamente a `candidatos_custodios`:

| Tabla | FK apunta a |
|---|---|
| `evaluaciones_toxicologicas` | `candidatos_custodios(id)` |
| `entrevistas_estructuradas` | `candidatos_custodios(id)` |
| `candidato_risk_checklist` | `candidatos_custodios(id)` |
| `referencias_candidato` | `candidatos_custodios(id)` |
| `contratos_candidato` | `candidatos_custodios(id)` |

Cuando el usuario selecciona modo "armados" en `EvaluacionesPage`, se consulta `candidatos_armados` y se pasa ese ID al `CandidateEvaluationPanel`, que intenta insertar en tablas que solo aceptan IDs de `candidatos_custodios`. Resultado: **todo falla**.

## Solución

### 1. Migración SQL: Eliminar FKs exclusivas y reemplazar con triggers de validación dual

Reemplazar cada FK `candidato_id → candidatos_custodios(id)` con un trigger que valide que el `candidato_id` exista en **cualquiera** de las dos tablas (`candidatos_custodios` OR `candidatos_armados`). Esto desbloquea a los armados sin romper custodios.

```sql
-- Función reutilizable
CREATE FUNCTION validate_candidato_id_dual()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_id)
     AND NOT EXISTS (SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_id) THEN
    RAISE EXCEPTION 'candidato_id % no existe en candidatos_custodios ni candidatos_armados', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a cada tabla (drop FK + create trigger)
-- evaluaciones_toxicologicas, entrevistas_estructuradas, 
-- candidato_risk_checklist, referencias_candidato, contratos_candidato
```

### 2. Frontend: Sin cambios necesarios

El `CandidateEvaluationPanel` ya recibe `tipoOperativo` y pasa el ID correcto. El problema es puramente de schema. Una vez que las FKs se reemplacen, todo funciona.

### Archivos impactados

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Drop 5 FKs, crear función `validate_candidato_id_dual`, crear 5 triggers |

### Riesgo

- Bajo: Los triggers mantienen la integridad referencial pero permiten ambas tablas origen
- ON DELETE CASCADE se pierde y deberá manejarse con triggers adicionales de cascada (o se puede mantener solo para custodios y agregar otro para armados)

