CREATE OR REPLACE FUNCTION sync_operativo_phone_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  UPDATE profiles
  SET phone = normalized_new,
      updated_at = now()
  WHERE LOWER(email) = LOWER(NEW.email);

  IF normalized_old != '' AND length(normalized_old) = 10 THEN
    UPDATE servicios_planificados
    SET custodio_telefono = normalized_new
    WHERE custodio_telefono = normalized_old
      AND fecha_hora_cita >= now()
      AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_operativo_phone_to_profile ON custodios_operativos;
CREATE TRIGGER trg_sync_operativo_phone_to_profile
  AFTER UPDATE OF telefono ON custodios_operativos
  FOR EACH ROW
  EXECUTE FUNCTION sync_operativo_phone_to_profile();