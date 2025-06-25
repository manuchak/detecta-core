
-- Agregar columna plan_rastreo_satelital faltante a servicios_monitoreo
ALTER TABLE servicios_monitoreo 
ADD COLUMN IF NOT EXISTS plan_rastreo_satelital text;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN servicios_monitoreo.plan_rastreo_satelital IS 'Plan de rastreo satelital: camino_seguro, flota_segura, cadena_segura, a_tu_medida, freightwatch';

-- Crear índice para optimizar consultas por plan
CREATE INDEX IF NOT EXISTS idx_servicios_monitoreo_plan_rastreo 
ON servicios_monitoreo(plan_rastreo_satelital);
