-- Agregar campo estado a gastos_externos
ALTER TABLE gastos_externos 
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

-- Crear índice para mejorar consultas por estado
CREATE INDEX IF NOT EXISTS idx_gastos_externos_estado ON gastos_externos(estado);

-- Agregar campos de aprobación
ALTER TABLE gastos_externos 
ADD COLUMN IF NOT EXISTS aprobado_en TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rechazado_en TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notas_aprobacion TEXT;