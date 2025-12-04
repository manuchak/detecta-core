-- 1. Etiquetar servicios SEICSA existentes
UPDATE servicios_custodia
SET proveedor = 'SEICSA'
WHERE id_servicio LIKE 'SIINSRH-%'
  AND (proveedor IS NULL OR proveedor = '');

-- 2. Agregar columnas para duración estimada en servicios_custodia
ALTER TABLE servicios_custodia ADD COLUMN IF NOT EXISTS duracion_estimada INTERVAL;
ALTER TABLE servicios_custodia ADD COLUMN IF NOT EXISTS metodo_estimacion TEXT;
ALTER TABLE servicios_custodia ADD COLUMN IF NOT EXISTS confianza_estimacion NUMERIC(3,2);

-- 3. Agregar columnas para captura prospectiva en servicios_planificados
ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS hora_inicio_real TIMESTAMPTZ;
ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS hora_fin_real TIMESTAMPTZ;

-- 4. Crear función para calcular duración real automáticamente
CREATE OR REPLACE FUNCTION calcular_duracion_real()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si ambas horas están presentes
  IF NEW.hora_inicio_real IS NOT NULL AND NEW.hora_fin_real IS NOT NULL THEN
    -- Actualizar servicio_custodia correspondiente si no tiene duración
    UPDATE servicios_custodia
    SET duracion_servicio = (NEW.hora_fin_real - NEW.hora_inicio_real)
    WHERE id = NEW.servicio_custodia_id
      AND duracion_servicio IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Crear trigger para sync automático
DROP TRIGGER IF EXISTS trigger_calcular_duracion_real ON servicios_planificados;
CREATE TRIGGER trigger_calcular_duracion_real
  AFTER UPDATE OF hora_inicio_real, hora_fin_real ON servicios_planificados
  FOR EACH ROW
  EXECUTE FUNCTION calcular_duracion_real();

-- 6. Crear índice para mejorar queries de proveedores externos
CREATE INDEX IF NOT EXISTS idx_servicios_custodia_proveedor 
ON servicios_custodia(proveedor) 
WHERE proveedor IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_servicios_custodia_id_servicio_pattern 
ON servicios_custodia(id_servicio) 
WHERE id_servicio LIKE 'SIINSRH-%';