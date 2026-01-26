-- Fase 1: Agregar campos de ubicación a custodio_liberacion
ALTER TABLE custodio_liberacion
ADD COLUMN IF NOT EXISTS direccion_residencia TEXT,
ADD COLUMN IF NOT EXISTS estado_residencia_id UUID REFERENCES estados(id),
ADD COLUMN IF NOT EXISTS ciudad_residencia TEXT;

COMMENT ON COLUMN custodio_liberacion.direccion_residencia IS 'Dirección completa de residencia del custodio';
COMMENT ON COLUMN custodio_liberacion.estado_residencia_id IS 'FK al catálogo de estados mexicanos';
COMMENT ON COLUMN custodio_liberacion.ciudad_residencia IS 'Nombre de la ciudad de residencia';

-- Índice para consultas por estado
CREATE INDEX IF NOT EXISTS idx_liberacion_estado_residencia 
ON custodio_liberacion(estado_residencia_id) 
WHERE estado_residencia_id IS NOT NULL;