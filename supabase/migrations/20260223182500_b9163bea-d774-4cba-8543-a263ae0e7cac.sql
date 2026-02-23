ALTER TABLE public.documentos_custodio 
  ADD COLUMN IF NOT EXISTS rechazado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_rechazo text,
  ADD COLUMN IF NOT EXISTS rechazado_por uuid,
  ADD COLUMN IF NOT EXISTS fecha_rechazo timestamptz;