-- Agregar campo de fecha y hora de recepción del servicio a pc_servicios
ALTER TABLE public.pc_servicios
ADD COLUMN IF NOT EXISTS fecha_hora_recepcion_servicio TIMESTAMPTZ NULL;