-- Add columns for false positioning tracking
ALTER TABLE servicios_planificados
ADD COLUMN IF NOT EXISTS posicionamiento_falso boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_posicionamiento_falso text,
ADD COLUMN IF NOT EXISTS cobro_posicionamiento boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hora_llegada_custodio time;