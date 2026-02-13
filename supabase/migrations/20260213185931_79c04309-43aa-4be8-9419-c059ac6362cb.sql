
-- =============================================================
-- Customer Success Module - ISO 9001:2015 Compatible
-- Tables: cs_quejas, cs_touchpoints, cs_capa, cs_health_scores
-- =============================================================

-- 1. cs_quejas - Central complaint/NCR registry
CREATE TABLE public.cs_quejas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_queja text NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id),
  servicio_id text,
  tipo text NOT NULL CHECK (tipo IN ('calidad_servicio', 'facturacion', 'cobertura', 'seguridad', 'consignas', 'otro')),
  severidad text NOT NULL DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  canal_entrada text NOT NULL CHECK (canal_entrada IN ('whatsapp', 'telefono', 'email', 'ejecutivo', 'seguimiento_proactivo')),
  descripcion text NOT NULL,
  evidencia_urls text[],
  estado text NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'en_investigacion', 'accion_correctiva', 'seguimiento', 'cerrada', 'reabierta')),
  asignado_a uuid REFERENCES auth.users(id),
  ejecutivo_cuenta uuid REFERENCES auth.users(id),
  causa_raiz text,
  accion_correctiva text,
  accion_preventiva text,
  fecha_compromiso timestamptz,
  fecha_resolucion timestamptz,
  calificacion_cierre int CHECK (calificacion_cierre BETWEEN 1 AND 5),
  requiere_capa boolean DEFAULT false,
  capa_id uuid,
  sla_respuesta_horas int DEFAULT 24,
  sla_resolucion_horas int DEFAULT 72,
  primera_respuesta_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. cs_touchpoints - Interaction history
CREATE TABLE public.cs_touchpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queja_id uuid REFERENCES public.cs_quejas(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id),
  tipo text NOT NULL CHECK (tipo IN ('llamada_seguimiento', 'email', 'whatsapp', 'reunion', 'visita', 'nota_interna')),
  direccion text NOT NULL DEFAULT 'saliente' CHECK (direccion IN ('entrante', 'saliente')),
  resumen text NOT NULL,
  contacto_nombre text,
  duracion_minutos int,
  siguiente_accion text,
  fecha_siguiente_accion timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. cs_capa - Corrective and Preventive Actions (ISO 10.2)
CREATE TABLE public.cs_capa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_capa text NOT NULL,
  queja_id uuid REFERENCES public.cs_quejas(id),
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id),
  tipo text NOT NULL DEFAULT 'correctiva' CHECK (tipo IN ('correctiva', 'preventiva')),
  descripcion_no_conformidad text NOT NULL,
  analisis_causa_raiz text,
  accion_inmediata text,
  accion_correctiva text,
  accion_preventiva text,
  responsable_id uuid REFERENCES auth.users(id),
  fecha_implementacion date,
  fecha_verificacion date,
  eficacia_verificada boolean DEFAULT false,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_proceso', 'implementado', 'verificado', 'cerrado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. cs_health_scores - Monthly account health snapshots
CREATE TABLE public.cs_health_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.pc_clientes(id),
  periodo date NOT NULL,
  score int DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  quejas_abiertas int DEFAULT 0,
  quejas_cerradas_mes int DEFAULT 0,
  csat_promedio numeric(3,1),
  servicios_mes int DEFAULT 0,
  touchpoints_mes int DEFAULT 0,
  riesgo_churn text DEFAULT 'bajo' CHECK (riesgo_churn IN ('bajo', 'medio', 'alto', 'critico')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, periodo)
);

-- Add FK from cs_quejas.capa_id to cs_capa
ALTER TABLE public.cs_quejas 
  ADD CONSTRAINT cs_quejas_capa_id_fkey FOREIGN KEY (capa_id) REFERENCES public.cs_capa(id);

-- Indexes
CREATE INDEX idx_cs_quejas_cliente ON public.cs_quejas(cliente_id);
CREATE INDEX idx_cs_quejas_estado ON public.cs_quejas(estado);
CREATE INDEX idx_cs_quejas_created ON public.cs_quejas(created_at DESC);
CREATE INDEX idx_cs_touchpoints_cliente ON public.cs_touchpoints(cliente_id);
CREATE INDEX idx_cs_touchpoints_queja ON public.cs_touchpoints(queja_id);
CREATE INDEX idx_cs_capa_estado ON public.cs_capa(estado);
CREATE INDEX idx_cs_capa_queja ON public.cs_capa(queja_id);
CREATE INDEX idx_cs_health_cliente_periodo ON public.cs_health_scores(cliente_id, periodo DESC);

-- Auto-folio for quejas: QJ-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_queja_folio()
RETURNS trigger AS $$
DECLARE
  year_str text;
  next_seq int;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_queja FROM 'QJ-' || year_str || '-(\d+)') AS int)
  ), 0) + 1
  INTO next_seq
  FROM public.cs_quejas
  WHERE numero_queja LIKE 'QJ-' || year_str || '-%';
  
  NEW.numero_queja := 'QJ-' || year_str || '-' || LPAD(next_seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cs_quejas_folio
  BEFORE INSERT ON public.cs_quejas
  FOR EACH ROW
  WHEN (NEW.numero_queja IS NULL OR NEW.numero_queja = '')
  EXECUTE FUNCTION public.generate_queja_folio();

-- Auto-folio for CAPA: CAPA-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_capa_folio()
RETURNS trigger AS $$
DECLARE
  year_str text;
  next_seq int;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_capa FROM 'CAPA-' || year_str || '-(\d+)') AS int)
  ), 0) + 1
  INTO next_seq
  FROM public.cs_capa
  WHERE numero_capa LIKE 'CAPA-' || year_str || '-%';
  
  NEW.numero_capa := 'CAPA-' || year_str || '-' || LPAD(next_seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cs_capa_folio
  BEFORE INSERT ON public.cs_capa
  FOR EACH ROW
  WHEN (NEW.numero_capa IS NULL OR NEW.numero_capa = '')
  EXECUTE FUNCTION public.generate_capa_folio();

-- Updated_at triggers
CREATE TRIGGER update_cs_quejas_updated_at
  BEFORE UPDATE ON public.cs_quejas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cs_capa_updated_at
  BEFORE UPDATE ON public.cs_capa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE public.cs_quejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_health_scores ENABLE ROW LEVEL SECURITY;

-- CS allowed roles for all operations
CREATE POLICY "CS staff full access quejas" ON public.cs_quejas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones'])
    )
  );

CREATE POLICY "CS staff full access touchpoints" ON public.cs_touchpoints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones'])
    )
  );

CREATE POLICY "CS staff full access capa" ON public.cs_capa
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones'])
    )
  );

CREATE POLICY "CS staff full access health_scores" ON public.cs_health_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones'])
    )
  );

-- Read-only for BI role
CREATE POLICY "BI read access quejas" ON public.cs_quejas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'bi'
    )
  );

CREATE POLICY "BI read access health_scores" ON public.cs_health_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'bi'
    )
  );
