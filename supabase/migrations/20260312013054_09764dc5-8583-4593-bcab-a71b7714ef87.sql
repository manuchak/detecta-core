-- Fix trigger: 'activa' → 'activo' to match actual data values
CREATE OR REPLACE FUNCTION sync_custodio_disponibilidad()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se crea/actualiza una indisponibilidad activa, marcar custodio como indisponible
  IF NEW.estado = 'activo' AND (NEW.fecha_fin_estimada IS NULL OR NEW.fecha_fin_estimada > NOW()) THEN
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
      AND estado = 'activo'
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
$$ LANGUAGE plpgsql;

-- Sync all currently desynchronized custodios
UPDATE custodios_operativos
SET disponibilidad = 'temporalmente_indisponible', updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT ci.custodio_id
  FROM custodio_indisponibilidades ci
  WHERE ci.estado = 'activo'
  AND (ci.fecha_fin_estimada IS NULL OR ci.fecha_fin_estimada > NOW())
)
AND disponibilidad != 'temporalmente_indisponible';