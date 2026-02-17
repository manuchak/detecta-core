
-- Phase 1.1: Add cantidad_armados_requeridos to servicios_planificados
ALTER TABLE servicios_planificados
  ADD COLUMN IF NOT EXISTS cantidad_armados_requeridos INTEGER NOT NULL DEFAULT 1;

-- Phase 1.2: Add index on asignacion_armados for efficient lookups by service
CREATE INDEX IF NOT EXISTS idx_asignacion_armados_servicio
  ON asignacion_armados(servicio_custodia_id, estado_asignacion);
