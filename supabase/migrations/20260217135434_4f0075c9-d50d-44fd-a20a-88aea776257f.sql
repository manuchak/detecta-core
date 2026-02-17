
-- Trigger: Sincronizar teléfono de profiles → custodios_operativos y servicios_planificados
-- Previene discrepancias como los casos de Hector y Oscar

CREATE OR REPLACE FUNCTION public.sync_profile_phone_to_operatives()
RETURNS TRIGGER AS $$
DECLARE
  normalized_new TEXT;
  normalized_old TEXT;
BEGIN
  -- Solo actuar si el teléfono cambió
  IF NEW.phone IS NOT DISTINCT FROM OLD.phone THEN
    RETURN NEW;
  END IF;

  -- Normalizar: solo dígitos, últimos 10
  normalized_new := RIGHT(regexp_replace(COALESCE(NEW.phone, ''), '[^0-9]', '', 'g'), 10);
  normalized_old := RIGHT(regexp_replace(COALESCE(OLD.phone, ''), '[^0-9]', '', 'g'), 10);

  -- Si después de normalizar son iguales, no hacer nada
  IF normalized_new = normalized_old OR length(normalized_new) < 10 THEN
    RETURN NEW;
  END IF;

  -- 1. Actualizar custodios_operativos que tengan el teléfono anterior
  UPDATE custodios_operativos
  SET telefono = normalized_new,
      updated_at = now()
  WHERE RIGHT(regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g'), 10) = normalized_old
    AND estado = 'activo';

  -- 2. Actualizar servicios_planificados pendientes/futuros
  UPDATE servicios_planificados
  SET custodio_telefono = normalized_new
  WHERE custodio_telefono = normalized_old
    AND fecha_hora_cita >= now()
    AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger en profiles
DROP TRIGGER IF EXISTS trg_sync_profile_phone ON profiles;
CREATE TRIGGER trg_sync_profile_phone
  AFTER UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_phone_to_operatives();
