-- ============================================
-- MIGRACIÓN: Sincronización de teléfono custodio en servicios_planificados
-- Permite que custodios vean servicios asignados desde planeación
-- ============================================

-- 1. Agregar campo custodio_telefono a servicios_planificados
ALTER TABLE servicios_planificados 
ADD COLUMN IF NOT EXISTS custodio_telefono TEXT;

-- 2. Crear índice para búsquedas rápidas por teléfono
CREATE INDEX IF NOT EXISTS idx_servicios_planificados_custodio_telefono 
ON servicios_planificados(custodio_telefono);

-- 3. Crear función para sincronizar teléfono desde custodios_operativos
CREATE OR REPLACE FUNCTION sync_custodio_telefono_on_service()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo sincronizar si custodio_id cambió o es nuevo y no nulo
  IF NEW.custodio_id IS NOT NULL AND 
     (TG_OP = 'INSERT' OR OLD.custodio_id IS DISTINCT FROM NEW.custodio_id) THEN
    SELECT telefono INTO NEW.custodio_telefono
    FROM custodios_operativos
    WHERE id = NEW.custodio_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Eliminar trigger existente si hay
DROP TRIGGER IF EXISTS trg_sync_custodio_telefono ON servicios_planificados;

-- 5. Crear trigger para sincronización automática
CREATE TRIGGER trg_sync_custodio_telefono
BEFORE INSERT OR UPDATE ON servicios_planificados
FOR EACH ROW EXECUTE FUNCTION sync_custodio_telefono_on_service();

-- 6. Backfill: Actualizar registros existentes con el teléfono
UPDATE servicios_planificados sp
SET custodio_telefono = co.telefono
FROM custodios_operativos co
WHERE sp.custodio_id = co.id
AND sp.custodio_telefono IS NULL;

-- 7. Agregar campo onboarding_completado a profiles para tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE;

-- 8. Comentarios de documentación
COMMENT ON COLUMN servicios_planificados.custodio_telefono IS 
'Teléfono del custodio asignado, sincronizado automáticamente desde custodios_operativos';

COMMENT ON COLUMN profiles.onboarding_completado IS 
'Indica si el custodio completó el proceso de onboarding de documentos';