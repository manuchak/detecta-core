

# Causa Raíz: Trigger con columna inexistente

## El Bug

El trigger `trg_check_lead_approval` ejecuta la función `check_lead_approval_has_candidato()` que contiene:

```sql
SELECT 1 FROM candidatos_custodios WHERE lead_id = NEW.id
```

**Pero `candidatos_custodios` NO tiene columna `lead_id`.** La relación es inversa: `leads.candidato_custodio_id → candidatos_custodios.id`.

## Flujo que falla

1. Analista clickea "Aprobar" en un lead
2. `useLeadApprovals.handleApproval()` ejecuta exitosamente:
   - ✅ Upsert en `lead_approval_process`
   - ✅ RPC `sync_lead_to_candidato` → crea candidato y setea `leads.candidato_custodio_id`
   - ✅ Migración de datos vehiculares
3. ❌ `sbx.update('leads', { estado: 'aprobado' })` → dispara el trigger
4. ❌ Trigger intenta `WHERE lead_id = NEW.id` → **column "lead_id" does not exist**

## Impacto en otros workflows

| Workflow | ¿Afectado? | Detalle |
|----------|-----------|---------|
| **Aprobación de custodios** | ❌ Bloqueado | Error impide cambiar estado a 'aprobado' |
| **Aprobación de armados** | ❌ Bloqueado | Mismo trigger se ejecuta; además `sync_lead_to_candidato_armado` no existe como RPC |
| **Rechazo de leads** | ✅ OK | Estado 'rechazado' no dispara la validación del trigger |
| **2da Entrevista** | ✅ OK | No cambia estado a 'aprobado' |
| **Pool de Reserva** | ⚠️ Parcial | Si el lead se aprueba desde pool, mismo error |
| **Evaluaciones/Liberación** | ⚠️ Indirecto | Sin aprobaciones, no llegan candidatos al pipeline de evaluación |

## Problema secundario: Armados sin RPC

La función `sync_lead_to_candidato_armado` se invoca en el código pero **no existe en la base de datos**. Los armados no pueden ser aprobados por doble fallo (RPC inexistente + trigger roto).

## Fix

Corregir el trigger para usar la relación correcta (`leads.candidato_custodio_id`) y también buscar en `candidatos_armados`:

```sql
CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    IF NEW.candidato_custodio_id IS NULL THEN
      RAISE EXCEPTION 'No se puede aprobar un lead sin crear el registro de candidato.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Esto valida que `candidato_custodio_id` esté seteado (lo cual `sync_lead_to_candidato` ya hace justo antes) sin necesidad de query a otra tabla.

Y crear la RPC faltante `sync_lead_to_candidato_armado` para el flujo de armados.

### Archivos a modificar
- **SQL**: Reemplazar función `check_lead_approval_has_candidato` del trigger
- **SQL**: Crear RPC `sync_lead_to_candidato_armado`

### Respuesta para Mariana

> Mariana, ya identifiqué el problema. Es un trigger de validación en la base de datos que busca una columna que no existe. Por eso no se pueden aprobar candidatos. Ya lo estamos corrigiendo — una vez aplicado el fix, el botón "Aprobar" funcionará correctamente.

