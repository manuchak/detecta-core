-- 1. Add profile_id column to custodios_operativos
ALTER TABLE custodios_operativos 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_custodios_operativos_profile_id 
ON custodios_operativos(profile_id) WHERE profile_id IS NOT NULL;

-- 3. Backfill: link existing custodios that have matching email in profiles
UPDATE custodios_operativos co
SET profile_id = p.id
FROM profiles p
WHERE LOWER(TRIM(co.email)) = LOWER(TRIM(p.email))
  AND co.profile_id IS NULL
  AND co.estado = 'activo';

-- 4. Replace sync trigger: profiles → custodios_operativos (use profile_id first, fallback to old phone match)
CREATE OR REPLACE FUNCTION sync_profile_phone_to_operatives()
RETURNS TRIGGER AS $$
DECLARE
  normalized_new TEXT;
  normalized_old TEXT;
  rows_updated INT;
BEGIN
  IF NEW.phone IS NOT DISTINCT FROM OLD.phone THEN
    RETURN NEW;
  END IF;

  normalized_new := RIGHT(regexp_replace(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g'), 10);
  normalized_old := RIGHT(regexp_replace(COALESCE(OLD.phone, ''), '[^0-9]', '', 'g'), 10);

  IF normalized_new = normalized_old OR length(normalized_new) < 10 THEN
    RETURN NEW;
  END IF;

  -- PRIMARY: Update by profile_id (direct link, always works)
  UPDATE custodios_operativos
  SET telefono = normalized_new, updated_at = now()
  WHERE profile_id = NEW.id AND estado = 'activo';

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- FALLBACK: If no rows matched by profile_id, try old phone match
  IF rows_updated = 0 AND length(normalized_old) = 10 THEN
    UPDATE custodios_operativos
    SET telefono = normalized_new,
        profile_id = NEW.id,  -- Auto-link on match
        updated_at = now()
    WHERE RIGHT(regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g'), 10) = normalized_old
      AND estado = 'activo';
  END IF;

  -- Update future servicios_planificados via profile_id
  UPDATE servicios_planificados
  SET custodio_telefono = normalized_new
  WHERE custodio_id IN (SELECT id FROM custodios_operativos WHERE profile_id = NEW.id)
    AND fecha_hora_cita >= now()
    AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');

  -- Fallback: also update by old phone
  IF length(normalized_old) = 10 THEN
    UPDATE servicios_planificados
    SET custodio_telefono = normalized_new
    WHERE custodio_telefono = normalized_old
      AND fecha_hora_cita >= now()
      AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Replace reverse sync trigger: custodios_operativos → profiles (use profile_id first)
CREATE OR REPLACE FUNCTION sync_operativo_phone_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  normalized_new TEXT;
  normalized_old TEXT;
BEGIN
  IF NEW.telefono IS NOT DISTINCT FROM OLD.telefono THEN
    RETURN NEW;
  END IF;

  normalized_new := RIGHT(regexp_replace(COALESCE(NEW.telefono, ''), '[^0-9]', '', 'g'), 10);
  normalized_old := RIGHT(regexp_replace(COALESCE(OLD.telefono, ''), '[^0-9]', '', 'g'), 10);

  IF normalized_new = normalized_old OR length(normalized_new) < 10 THEN
    RETURN NEW;
  END IF;

  -- PRIMARY: Update profile by profile_id
  IF NEW.profile_id IS NOT NULL THEN
    UPDATE profiles
    SET phone = normalized_new, updated_at = now()
    WHERE id = NEW.profile_id;
  ELSE
    -- FALLBACK: by email match
    UPDATE profiles
    SET phone = normalized_new, updated_at = now()
    WHERE LOWER(email) = LOWER(NEW.email);
  END IF;

  -- Update future servicios_planificados
  IF length(normalized_old) = 10 THEN
    UPDATE servicios_planificados
    SET custodio_telefono = normalized_new
    WHERE custodio_telefono = normalized_old
      AND fecha_hora_cita >= now()
      AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Fix Javier Romero: set profile.phone from custodios_operativos
UPDATE profiles p
SET phone = co.telefono, updated_at = now()
FROM custodios_operativos co
WHERE LOWER(TRIM(co.email)) = LOWER(TRIM(p.email))
  AND co.nombre = 'JAVIER ROMERO'
  AND (p.phone IS NULL OR p.phone = '')
  AND co.estado = 'activo';

-- 7. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';