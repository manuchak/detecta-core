
-- Table to track individual NPS sends within a campaign period
CREATE TABLE public.cs_nps_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo TEXT NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  canal_envio TEXT NOT NULL DEFAULT 'email',
  enviado_at TIMESTAMPTZ,
  respondido_at TIMESTAMPTZ,
  nps_response_id UUID REFERENCES public.cs_nps_campaigns(id) ON DELETE SET NULL,
  enviado_por UUID,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(periodo, cliente_id)
);

-- Enable RLS
ALTER TABLE public.cs_nps_sends ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can manage sends
CREATE POLICY "Authenticated users can view NPS sends"
  ON public.cs_nps_sends FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert NPS sends"
  ON public.cs_nps_sends FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update NPS sends"
  ON public.cs_nps_sends FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete NPS sends"
  ON public.cs_nps_sends FOR DELETE TO authenticated USING (true);

-- Index for fast lookups
CREATE INDEX idx_cs_nps_sends_periodo ON public.cs_nps_sends(periodo);
CREATE INDEX idx_cs_nps_sends_estado ON public.cs_nps_sends(estado);

-- Trigger for updated_at
CREATE TRIGGER update_cs_nps_sends_updated_at
  BEFORE UPDATE ON public.cs_nps_sends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
