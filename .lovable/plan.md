

# Bug Report de Jennifer: No puede reactivar candidato desde Pool

## Causa Raíz

**Conflicto entre el trigger que acabamos de desplegar y el flujo de reactivación del pool.**

El trigger `check_lead_approval_has_candidato` (que corregimos hace minutos para el bug de Mariana) ahora bloquea CUALQUIER transición a `estado = 'aprobado'` si `candidato_custodio_id IS NULL`. Esto es correcto para aprobaciones nuevas, pero rompe la reactivación desde pool.

### Flujo de Jennifer:
1. Crea lead (estado: `nuevo`)
2. Registra entrevista (estado: `contactado` o `en_revision`)
3. Mueve a pool → RPC `move_lead_to_pool` cambia estado a `aprobado_en_espera`
4. Intenta reactivar → RPC `reactivate_lead_from_pool` intenta poner `estado = 'aprobado'`
5. **TRIGGER BLOQUEA**: `candidato_custodio_id IS NULL` → Error

El lead nunca pasó por el flujo formal de aprobación (nunca se creó un candidato_custodio), así que el trigger lo rechaza legítimamente. Pero la reactivación desde pool es un caso válido que debería estar exento.

## Impacto
- Todo candidato en pool que no haya sido formalmente aprobado NO puede ser reactivado
- Afecta a Jennifer y cualquier analista que use el pool como "sala de espera" para candidatos en proceso

## Fix: Dos cambios

### 1. Modificar trigger `check_lead_approval_has_candidato`
Agregar excepción para reactivación desde pool (`OLD.estado = 'aprobado_en_espera'`):

```sql
CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    -- Permitir reactivación desde pool (el candidato pudo no haber sido aprobado formalmente)
    IF OLD.estado = 'aprobado_en_espera' THEN
      RETURN NEW;
    END IF;
    -- Para nuevas aprobaciones, exigir vínculo con candidato
    IF NEW.candidato_custodio_id IS NULL 
       AND NOT EXISTS (SELECT 1 FROM candidatos_armados WHERE lead_id = NEW.id)
    THEN
      RAISE EXCEPTION 'No se puede aprobar un lead sin crear el registro de candidato.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Mejorar reactivación para ofrecer estado de retorno flexible
Actualmente el botón "Reactivar" siempre fuerza `estado = 'aprobado'`. Para leads que nunca fueron aprobados formalmente, debería retornar a `en_revision` (estado pre-pool que permite enviar pruebas psicométricas).

Modificar `PoolCandidateCard.tsx` y `PoolReservaView.tsx` para que el botón "Reactivar" permita elegir el estado destino (`aprobado` si ya tiene candidato, `en_revision` si no).

### Archivos
1. **SQL Migration**: Actualizar función `check_lead_approval_has_candidato` — agregar bypass para `aprobado_en_espera`
2. **`src/components/leads/pool/PoolCandidateCard.tsx`**: Agregar lógica condicional al botón Reactivar según si el candidato tiene `candidato_custodio_id`
3. **`src/hooks/usePoolReserva.ts`**: Ajustar estado default de reactivación basado en contexto del candidato

### Respuesta para Jennifer

> Jennifer, ya identifiqué el problema. El candidato fue movido al pool sin haber pasado por el flujo formal de aprobación, y el sistema ahora valida eso al reactivar. Ya estamos desplegando el fix — en unos minutos podrás reactivar candidatos desde el pool sin problema. Si el candidato no fue aprobado formalmente, se reactivará en estado "En revisión" para que puedas enviarle la prueba.

