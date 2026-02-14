
-- Standalone CSAT surveys (independent from complaint-based CSAT)
CREATE TABLE public.cs_csat_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.pc_clientes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  contexto TEXT NOT NULL DEFAULT 'periodico',
  comentario TEXT,
  servicio_id INTEGER REFERENCES public.servicios_custodia(id) ON DELETE SET NULL,
  canal TEXT NOT NULL DEFAULT 'email',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cs_csat_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view CSAT surveys"
  ON public.cs_csat_surveys FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert CSAT surveys"
  ON public.cs_csat_surveys FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update CSAT surveys"
  ON public.cs_csat_surveys FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete CSAT surveys"
  ON public.cs_csat_surveys FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_cs_csat_surveys_cliente ON public.cs_csat_surveys(cliente_id);
CREATE INDEX idx_cs_csat_surveys_contexto ON public.cs_csat_surveys(contexto);
CREATE INDEX idx_cs_csat_surveys_created ON public.cs_csat_surveys(created_at DESC);
