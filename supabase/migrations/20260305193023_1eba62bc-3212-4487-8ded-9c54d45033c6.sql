-- Remove absolute UNIQUE constraint on id_servicio
ALTER TABLE servicios_planificados 
  DROP CONSTRAINT IF EXISTS servicios_planificados_id_servicio_key;

-- Remove any existing unique index
DROP INDEX IF EXISTS idx_servicios_planificados_id_servicio_unique;

-- Create partial unique index: only enforced for non-cancelled services
CREATE UNIQUE INDEX idx_servicios_planificados_id_servicio_active
ON servicios_planificados (id_servicio)
WHERE estado_planeacion != 'cancelado';