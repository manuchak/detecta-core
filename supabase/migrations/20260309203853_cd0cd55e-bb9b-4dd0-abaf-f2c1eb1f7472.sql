
-- Add revert columns to bitacora_entregas_turno
ALTER TABLE public.bitacora_entregas_turno
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS revertida_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS revertida_at timestamptz;

-- Add check constraint for estado values
ALTER TABLE public.bitacora_entregas_turno
  ADD CONSTRAINT chk_entrega_estado CHECK (estado IN ('activa', 'revertida'));

-- UPDATE policy: only coordinators can revert
CREATE POLICY "coordinators_update_entregas_turno"
  ON public.bitacora_entregas_turno
  FOR UPDATE
  TO authenticated
  USING (public.has_monitoring_write_role())
  WITH CHECK (public.has_monitoring_write_role());
