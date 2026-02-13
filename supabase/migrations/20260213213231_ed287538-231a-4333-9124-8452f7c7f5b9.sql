
-- Add traceability columns for client deactivation
ALTER TABLE public.pc_clientes 
  ADD COLUMN IF NOT EXISTS motivo_baja TEXT,
  ADD COLUMN IF NOT EXISTS fecha_baja TIMESTAMPTZ;

-- Add index for filtering by active status + fecha_baja
CREATE INDEX IF NOT EXISTS idx_pc_clientes_activo_fecha_baja 
  ON public.pc_clientes (activo, fecha_baja);
