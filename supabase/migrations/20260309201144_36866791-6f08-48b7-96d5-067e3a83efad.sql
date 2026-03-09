
-- Table for temporary pauses (comida, baño, descanso)
CREATE TABLE public.bitacora_pausas_monitorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitorista_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_pausa text NOT NULL CHECK (tipo_pausa IN ('comida', 'bano', 'descanso')),
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada', 'expirada')),
  servicios_redistribuidos jsonb NOT NULL DEFAULT '[]'::jsonb,
  inicio timestamptz NOT NULL DEFAULT now(),
  fin_esperado timestamptz NOT NULL,
  fin_real timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.bitacora_pausas_monitorista ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_select_pausas"
  ON public.bitacora_pausas_monitorista
  FOR SELECT TO authenticated
  USING (public.has_monitoring_role());

CREATE POLICY "monitoring_insert_pausas"
  ON public.bitacora_pausas_monitorista
  FOR INSERT TO authenticated
  WITH CHECK (public.has_monitoring_role() AND monitorista_id = auth.uid());

CREATE POLICY "monitoring_update_pausas"
  ON public.bitacora_pausas_monitorista
  FOR UPDATE TO authenticated
  USING (public.has_monitoring_role())
  WITH CHECK (public.has_monitoring_role());

-- Index for active pause lookups
CREATE INDEX idx_pausas_monitorista_activa ON public.bitacora_pausas_monitorista (monitorista_id, estado) WHERE estado = 'activa';
