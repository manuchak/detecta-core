
-- Create evaluaciones_midot table
CREATE TABLE public.evaluaciones_midot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES public.candidatos_custodios(id) ON DELETE CASCADE,
  evaluador_id uuid NOT NULL,
  score_integridad numeric CHECK (score_integridad >= 0 AND score_integridad <= 100),
  score_honestidad numeric CHECK (score_honestidad >= 0 AND score_honestidad <= 100),
  score_lealtad numeric CHECK (score_lealtad >= 0 AND score_lealtad <= 100),
  score_global numeric CHECK (score_global >= 0 AND score_global <= 100),
  resultado_semaforo varchar NOT NULL DEFAULT 'pendiente',
  reporte_pdf_url text,
  notas text,
  fecha_evaluacion timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_evaluaciones_midot_candidato ON public.evaluaciones_midot(candidato_id);

-- Enable RLS
ALTER TABLE public.evaluaciones_midot ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as evaluaciones_psicometricas)
CREATE POLICY "Authenticated users can view midot evaluations"
  ON public.evaluaciones_midot FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert midot evaluations"
  ON public.evaluaciones_midot FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update midot evaluations"
  ON public.evaluaciones_midot FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_evaluaciones_midot_updated_at
  BEFORE UPDATE ON public.evaluaciones_midot
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
