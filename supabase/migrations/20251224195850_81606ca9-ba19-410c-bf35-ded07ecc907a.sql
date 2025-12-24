-- =====================================================
-- FASE 1: Corrección inmediata de indisponibilidades expiradas
-- =====================================================

-- 1. Cerrar indisponibilidades que ya expiraron pero no tienen fecha_fin_real
UPDATE custodio_indisponibilidades
SET 
  fecha_fin_real = fecha_fin_estimada,
  estado = 'resuelta',
  notas = COALESCE(notas, '') || ' | Cerrada automáticamente - indisponibilidad expirada',
  updated_at = NOW()
WHERE 
  fecha_fin_estimada IS NOT NULL 
  AND fecha_fin_estimada < NOW() 
  AND fecha_fin_real IS NULL
  AND estado IN ('activa', 'pendiente');

-- 2. Restaurar disponibilidad de custodios que ya no tienen indisponibilidades activas
UPDATE custodios_operativos co
SET 
  disponibilidad = 'disponible',
  updated_at = NOW()
WHERE 
  co.disponibilidad = 'temporalmente_indisponible'
  AND co.estado = 'activo'
  AND NOT EXISTS (
    SELECT 1 FROM custodio_indisponibilidades ci
    WHERE ci.custodio_id = co.id
    AND ci.estado = 'activa'
    AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > NOW())
  );

-- =====================================================
-- FASE 2: Función automática para procesar indisponibilidades
-- =====================================================

CREATE OR REPLACE FUNCTION public.procesar_indisponibilidades_expiradas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_indisponibilidades_cerradas INTEGER := 0;
  v_custodios_restaurados INTEGER := 0;
  v_resultado jsonb;
BEGIN
  -- 1. Cerrar indisponibilidades expiradas
  WITH cerradas AS (
    UPDATE custodio_indisponibilidades
    SET 
      fecha_fin_real = fecha_fin_estimada,
      estado = 'resuelta',
      notas = COALESCE(notas, '') || ' | Auto-cerrada: ' || NOW()::text,
      updated_at = NOW()
    WHERE 
      fecha_fin_estimada IS NOT NULL 
      AND fecha_fin_estimada < NOW() 
      AND fecha_fin_real IS NULL
      AND estado IN ('activa', 'pendiente')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_indisponibilidades_cerradas FROM cerradas;

  -- 2. Restaurar disponibilidad de custodios sin indisponibilidades activas
  WITH restaurados AS (
    UPDATE custodios_operativos co
    SET 
      disponibilidad = 'disponible',
      updated_at = NOW()
    WHERE 
      co.disponibilidad = 'temporalmente_indisponible'
      AND co.estado = 'activo'
      AND NOT EXISTS (
        SELECT 1 FROM custodio_indisponibilidades ci
        WHERE ci.custodio_id = co.id
        AND ci.estado = 'activa'
        AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > NOW())
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_custodios_restaurados FROM restaurados;

  v_resultado := jsonb_build_object(
    'success', true,
    'timestamp', NOW(),
    'indisponibilidades_cerradas', v_indisponibilidades_cerradas,
    'custodios_restaurados', v_custodios_restaurados
  );

  RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.procesar_indisponibilidades_expiradas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.procesar_indisponibilidades_expiradas() TO service_role;

-- =====================================================
-- FASE 3: Trigger para sincronizar disponibilidad automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_custodio_disponibilidad()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si se crea/actualiza una indisponibilidad activa, marcar custodio como indisponible
  IF NEW.estado = 'activa' AND (NEW.fecha_fin_estimada IS NULL OR NEW.fecha_fin_estimada > NOW()) THEN
    UPDATE custodios_operativos
    SET disponibilidad = 'temporalmente_indisponible', updated_at = NOW()
    WHERE id = NEW.custodio_id;
  END IF;
  
  -- Si la indisponibilidad se resuelve/cancela, verificar si hay otras activas
  IF NEW.estado IN ('resuelta', 'cancelada') OR NEW.fecha_fin_real IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM custodio_indisponibilidades
      WHERE custodio_id = NEW.custodio_id
      AND id != NEW.id
      AND estado = 'activa'
      AND (fecha_fin_estimada IS NULL OR fecha_fin_estimada > NOW())
    ) THEN
      UPDATE custodios_operativos
      SET disponibilidad = 'disponible', updated_at = NOW()
      WHERE id = NEW.custodio_id
      AND disponibilidad = 'temporalmente_indisponible';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_custodio_disponibilidad ON custodio_indisponibilidades;

CREATE TRIGGER tr_sync_custodio_disponibilidad
AFTER INSERT OR UPDATE ON custodio_indisponibilidades
FOR EACH ROW
EXECUTE FUNCTION public.sync_custodio_disponibilidad();