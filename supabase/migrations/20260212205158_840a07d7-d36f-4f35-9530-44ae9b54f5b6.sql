
-- Create candidatos_armados table (mirrors candidatos_custodios for armed escorts)
CREATE TABLE public.candidatos_armados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  telefono text,
  email text,
  tipo_armado text NOT NULL DEFAULT 'interno',
  proveedor_id uuid REFERENCES public.proveedores_armados(id) ON DELETE SET NULL,
  licencia_portacion text,
  fecha_vencimiento_licencia date,
  estado_proceso text DEFAULT 'lead',
  estado_detallado text,
  zona_preferida_id uuid REFERENCES public.zonas_operacion_nacional(id) ON DELETE SET NULL,
  calificacion_inicial numeric,
  experiencia_seguridad boolean DEFAULT false,
  vehiculo_propio boolean DEFAULT false,
  notas_recruiter text,
  fuente_reclutamiento text,
  is_test boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_candidatos_armados_estado ON public.candidatos_armados(estado_proceso);
CREATE INDEX idx_candidatos_armados_lead ON public.candidatos_armados(lead_id);

-- Enable RLS
ALTER TABLE public.candidatos_armados ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view candidatos_armados"
  ON public.candidatos_armados FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert candidatos_armados"
  ON public.candidatos_armados FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidatos_armados"
  ON public.candidatos_armados FOR UPDATE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_candidatos_armados_updated_at
  BEFORE UPDATE ON public.candidatos_armados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add tipo_operativo to custodio_liberacion
ALTER TABLE public.custodio_liberacion
  ADD COLUMN tipo_operativo text NOT NULL DEFAULT 'custodio';

CREATE INDEX idx_custodio_liberacion_tipo ON public.custodio_liberacion(tipo_operativo);
