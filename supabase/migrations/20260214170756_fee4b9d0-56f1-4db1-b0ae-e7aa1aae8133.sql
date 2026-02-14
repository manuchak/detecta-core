
-- Table for NPS campaign surveys
CREATE TABLE public.cs_nps_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL, -- 'YYYY-MM' or 'Q1-2026' etc
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  comentario TEXT,
  canal TEXT NOT NULL DEFAULT 'email',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cs_nps_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read NPS"
  ON public.cs_nps_campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert NPS"
  ON public.cs_nps_campaigns FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update NPS"
  ON public.cs_nps_campaigns FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete NPS"
  ON public.cs_nps_campaigns FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_cs_nps_campaigns_cliente ON public.cs_nps_campaigns(cliente_id);
CREATE INDEX idx_cs_nps_campaigns_periodo ON public.cs_nps_campaigns(periodo);
