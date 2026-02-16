
-- Add digital signature columns for incident creation and closure
ALTER TABLE public.incidentes_operativos
  ADD COLUMN IF NOT EXISTS firma_creacion_base64 text,
  ADD COLUMN IF NOT EXISTS firma_creacion_email text,
  ADD COLUMN IF NOT EXISTS firma_creacion_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS firma_cierre_base64 text,
  ADD COLUMN IF NOT EXISTS firma_cierre_email text,
  ADD COLUMN IF NOT EXISTS firma_cierre_timestamp timestamptz;
