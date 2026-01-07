-- Agregar columna JSONB para gadgets con cantidades
ALTER TABLE servicios_planificados 
ADD COLUMN IF NOT EXISTS gadgets_cantidades JSONB DEFAULT '[]'::jsonb;

-- Comentario descriptivo
COMMENT ON COLUMN servicios_planificados.gadgets_cantidades IS 
  'Array de objetos con tipo de gadget y cantidad. Ej: [{"tipo": "candado_satelital", "cantidad": 3}]';

-- Índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_servicios_gadgets_cantidades ON servicios_planificados 
USING GIN (gadgets_cantidades);