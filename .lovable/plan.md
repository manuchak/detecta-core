

# Prevención de Desincronización de Teléfonos entre Subsistemas

## Diagnóstico Actual

**Estado de la base de datos (152 custodios activos):**
- 53 con profile y teléfono sincronizado
- 3 con profile y teléfono desincronizado (JUAN PABLO RIVERA, MARCO ANTONIO CARDENAS, JAVIER ROMERO)
- 96 sin profile (aún no se registran en la app)

**Triggers existentes (bidireccionales):**
1. `trg_sync_profile_phone` — profiles → custodios_operativos (por email match)
2. `trg_sync_operativo_phone_to_profile` — custodios_operativos → profiles (por email match)

**Por qué siguen ocurriendo desincs a pesar de los triggers:**
- Los triggers dependen de que el **email coincida** entre ambas tablas. Si un custodio se registra con un email diferente al que tiene en `custodios_operativos`, el trigger no encuentra match y la sincronización falla silenciosamente.
- Cuando un custodio actualiza su teléfono desde el PhoneUpdatePrompt, se actualiza `profiles.phone` pero el trigger busca en `custodios_operativos` por el **teléfono anterior**. Si el teléfono anterior tampoco coincidía, no hay match.
- No hay validación que impida registrar un teléfono que no existe en `custodios_operativos`.

## Solución: Validación + Sincronización por ID directo

### 1. Agregar columna `profile_id` a `custodios_operativos`
Un FK directo que vincule de forma inmutable el custodio operativo con su profile, eliminando la dependencia frágil de email/teléfono para sincronización.

```sql
ALTER TABLE custodios_operativos 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Backfill: vincular los 53+ que ya tienen email match
UPDATE custodios_operativos co
SET profile_id = p.id
FROM profiles p
WHERE LOWER(co.email) = LOWER(p.email)
AND co.profile_id IS NULL;
```

### 2. Trigger mejorado: sincronizar por `profile_id` (no email)
Reemplazar el trigger actual `trg_sync_profile_phone` para que use `profile_id` como vínculo primario, con fallback a email.

```sql
CREATE OR REPLACE FUNCTION sync_profile_phone_to_operatives()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT DISTINCT FROM OLD.phone THEN RETURN NEW; END IF;
  
  -- Normalizar
  normalized_new := RIGHT(regexp_replace(NEW.phone,'[^0-9]','','g'),10);
  
  -- Actualizar por profile_id (vínculo directo, siempre funciona)
  UPDATE custodios_operativos
  SET telefono = normalized_new, updated_at = now()
  WHERE profile_id = NEW.id AND estado = 'activo';
  
  -- También actualizar servicios planificados futuros
  UPDATE servicios_planificados
  SET custodio_telefono = normalized_new
  WHERE custodio_id IN (SELECT id FROM custodios_operativos WHERE profile_id = NEW.id)
    AND fecha_hora_cita >= now()
    AND estado_planeacion NOT IN ('cancelado','completado','finalizado');
  
  RETURN NEW;
END;
```

### 3. Validación en frontend: PhoneUpdatePrompt verifica contra `custodios_operativos`
Antes de guardar un teléfono nuevo, verificar que el número existe en `custodios_operativos`. Si no existe, mostrar error y no permitir el cambio. Esto ya se hace parcialmente en `MobileDashboardLayout.handlePhoneUpdate` (llama `findCustodioByPhone`), pero falta en `CustodianOnboarding.handlePhoneUpdate` donde se actualiza sin validar.

**Cambios en `CustodianOnboarding.tsx`:**
- Después de actualizar `profiles.phone`, verificar que el nuevo teléfono tiene match en `custodios_operativos`
- Si hay match, vincular `profile_id` automáticamente
- Si no hay match, advertir al usuario

### 4. Auto-vincular `profile_id` en login/onboarding
Cuando un custodio hace login o completa onboarding, buscar automáticamente su registro en `custodios_operativos` por teléfono normalizado y setear `profile_id`.

### 5. Fix inmediato: corregir los 3 casos desincronizados actuales

| Custodio | co_phone | profile_phone | Acción |
|---|---|---|---|
| JAVIER ROMERO | 5530201454 | (vacío) | Setear profile.phone = co.telefono |
| JUAN PABLO RIVERA | 5537045855 | 5545453426 | Confirmar cuál es correcto con Planning |
| MARCO ANTONIO CARDENAS | 7774988416 | 5640016408 | Confirmar cuál es correcto con Planning |

### Archivos a modificar

| Archivo/Target | Cambio |
|---|---|
| DB Migration | Agregar `profile_id` a `custodios_operativos`, backfill, trigger mejorado |
| `src/pages/custodian/CustodianOnboarding.tsx` | Validar teléfono contra `custodios_operativos` antes de guardar |
| `src/components/custodian/MobileDashboardLayout.tsx` | Auto-vincular `profile_id` cuando se encuentra match |
| DB Data fix | Corregir los 3 desincs actuales |

