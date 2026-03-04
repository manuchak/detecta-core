
ALTER TABLE public.progreso_capacitacion
ADD COLUMN IF NOT EXISTS completado_manual BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.progreso_capacitacion
ADD COLUMN IF NOT EXISTS completado_manual_por UUID NULL;

ALTER TABLE public.progreso_capacitacion
ADD COLUMN IF NOT EXISTS completado_manual_fecha TIMESTAMPTZ NULL;

ALTER TABLE public.progreso_capacitacion
ADD COLUMN IF NOT EXISTS completado_manual_notas TEXT NULL;
