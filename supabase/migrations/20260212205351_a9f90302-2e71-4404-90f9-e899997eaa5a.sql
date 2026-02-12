
-- Add GPS flexible columns to custodio_liberacion
ALTER TABLE public.custodio_liberacion
  ADD COLUMN IF NOT EXISTS gps_pendiente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_gps_pendiente text,
  ADD COLUMN IF NOT EXISTS fecha_programacion_gps date;

-- Add check constraint for motivo when gps_pendiente is true
ALTER TABLE public.custodio_liberacion
  ADD CONSTRAINT chk_gps_pendiente_motivo
  CHECK (gps_pendiente = false OR motivo_gps_pendiente IS NOT NULL);
