-- Add missing columns used by cancel workflow
ALTER TABLE public.servicios_planificados
  ADD COLUMN IF NOT EXISTS cancelado_por uuid NULL,
  ADD COLUMN IF NOT EXISTS fecha_cancelacion timestamp with time zone NULL;

COMMENT ON COLUMN public.servicios_planificados.cancelado_por IS 'Usuario que canceló el servicio';
COMMENT ON COLUMN public.servicios_planificados.fecha_cancelacion IS 'Fecha y hora de cancelación';

-- Helpful index for filtering/reporting by cancellation date
CREATE INDEX IF NOT EXISTS idx_servicios_planificados_fecha_cancelacion
  ON public.servicios_planificados (fecha_cancelacion);
