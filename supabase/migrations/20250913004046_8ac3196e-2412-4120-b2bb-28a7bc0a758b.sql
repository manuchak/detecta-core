-- Fix productos_serie estado constraint to include 'dado_de_baja'
-- Drop the existing constraint
ALTER TABLE productos_serie DROP CONSTRAINT IF EXISTS productos_serie_estado_check;

-- Add the updated constraint that includes 'dado_de_baja'
ALTER TABLE productos_serie ADD CONSTRAINT productos_serie_estado_check 
CHECK (estado IN ('disponible', 'reservado', 'asignado', 'instalado', 'defectuoso', 'reparacion', 'dado_de_baja'));