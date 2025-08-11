-- Add new columns to pc_servicios for import mapping enhancements
ALTER TABLE public.pc_servicios
ADD COLUMN IF NOT EXISTS cliente text NULL,
ADD COLUMN IF NOT EXISTS hora_programacion time NULL;