

# Fix: Leads marcados como "aprobado" sin crear registro en candidatos_custodios

## Causa raíz

Existen **3 puntos de entrada** donde un analista puede cambiar el estado de un lead a "aprobado" **sin pasar por el workflow de aprobación** (`useLeadApprovals.ts`):

1. **`LeadForm.tsx`** — Select con opción "Aprobado" (línea 180)
2. **`LeadsTable.tsx`** — Filtro por estado incluye "Aprobado" (línea 605) 
3. **`LeadEditDialog.tsx`** — Select con opción "Aprobado" (línea 769)
4. **`EnhancedLeadForm.tsx`** — Campo `estado_lead` que se guarda directamente

El RPC `sync_lead_to_candidato` que crea el registro en `candidatos_custodios` **solo se invoca desde `useLeadApprovals.ts`**. Si alguien cambia el estado directamente desde los formularios, el lead queda como "aprobado" pero **nunca se crea el candidato**.

Esto es exactamente lo que pasó con Alfonso Avalos: Jenifer lo creó/editó desde el formulario y le puso estado "aprobado" sin pasar por el flujo de aprobaciones.

## Solución: Doble protección

### 1. Remover "aprobado" de los selectores manuales

En **LeadForm.tsx**, **LeadEditDialog.tsx** y **EnhancedLeadForm.tsx**, eliminar "aprobado" como opción seleccionable en los dropdowns de estado. La aprobación **solo debe ocurrir** a través del flujo formal en `useLeadApprovals`.

Los estados disponibles en formularios manuales serán: `nuevo`, `contactado`, `en_revision`, `en_proceso`, `pendiente`, `rechazado`.

### 2. Agregar guard en el backend (migración SQL)

Crear un **trigger** en la tabla `leads` que, al detectar un cambio de estado a `aprobado`, verifique si ya existe un registro en `candidatos_custodios` con ese `lead_id`. Si no existe, **bloquear la actualización** y lanzar un error descriptivo. Esto actúa como red de seguridad contra cualquier bypass futuro.

```sql
CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    IF NOT EXISTS (
      SELECT 1 FROM candidatos_custodios 
      WHERE lead_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'No se puede aprobar un lead sin crear el registro de candidato. Use el flujo de aprobaciones.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_lead_approval
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION check_lead_approval_has_candidato();
```

### Archivos impactados

| Archivo | Cambio |
|---|---|
| `src/components/leads/LeadForm.tsx` | Remover "aprobado" del Select de estados |
| `src/components/leads/LeadEditDialog.tsx` | Remover "aprobado" del Select de estados |
| `src/components/leads/EnhancedLeadForm.tsx` | Verificar que no permita estado "aprobado" manual |
| Migración SQL | Trigger de protección en tabla `leads` |

