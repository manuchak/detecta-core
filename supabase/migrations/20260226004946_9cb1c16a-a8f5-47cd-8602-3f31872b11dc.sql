
-- Table: plantillas_contrato_versiones
CREATE TABLE public.plantillas_contrato_versiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id uuid NOT NULL REFERENCES public.plantillas_contrato(id) ON DELETE CASCADE,
  version integer NOT NULL,
  contenido_html text NOT NULL,
  variables_requeridas text[],
  change_description text,
  changed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: legal_compliance_checks
CREATE TABLE public.legal_compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id uuid NOT NULL REFERENCES public.plantillas_contrato(id) ON DELETE CASCADE,
  compliance_type text NOT NULL,
  status text NOT NULL DEFAULT 'review_needed',
  last_reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plantillas_contrato_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS: versiones
CREATE POLICY "Authenticated read template versions"
  ON public.plantillas_contrato_versiones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin insert template versions"
  ON public.plantillas_contrato_versiones FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'supply_admin') OR
    public.has_role(auth.uid(), 'coordinador_operaciones')
  );

-- RLS: compliance
CREATE POLICY "Authenticated read compliance checks"
  ON public.legal_compliance_checks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage compliance checks"
  ON public.legal_compliance_checks FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'supply_admin') OR
    public.has_role(auth.uid(), 'coordinador_operaciones')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'supply_admin') OR
    public.has_role(auth.uid(), 'coordinador_operaciones')
  );

-- Indexes
CREATE INDEX idx_versiones_plantilla_id ON public.plantillas_contrato_versiones(plantilla_id, version DESC);
CREATE INDEX idx_compliance_plantilla_id ON public.legal_compliance_checks(plantilla_id);
