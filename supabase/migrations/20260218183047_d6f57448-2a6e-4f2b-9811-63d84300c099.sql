
-- ============================================================
-- MÓDULO DE SEGURIDAD INTEGRAL - Tablas Base
-- Integración Hermes + Detecta
-- ============================================================

-- 1. Risk Zone Scores (H3 hexagon-based risk scoring)
CREATE TABLE public.risk_zone_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT UNIQUE NOT NULL,
  h3_resolution INTEGER DEFAULT 6,
  base_score NUMERIC DEFAULT 0,
  manual_adjustment NUMERIC DEFAULT 0,
  final_score NUMERIC GENERATED ALWAYS AS (base_score + manual_adjustment) STORED,
  risk_level TEXT DEFAULT 'bajo',
  price_multiplier NUMERIC DEFAULT 1.0,
  event_count INTEGER DEFAULT 0,
  last_event_date DATE,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_zones_h3 ON public.risk_zone_scores(h3_index);
CREATE INDEX idx_risk_zones_level ON public.risk_zone_scores(risk_level);

ALTER TABLE public.risk_zone_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risk zones"
  ON public.risk_zone_scores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security staff can manage risk zones"
  ON public.risk_zone_scores FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad', 'analista_seguridad', 'coordinador_operaciones')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- 2. Security Events (incidents feeding H3 scores)
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT NOT NULL,
  h3_resolution INTEGER DEFAULT 6,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  source TEXT,
  reported_by UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT false,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_h3 ON public.security_events(h3_index);
CREATE INDEX idx_security_events_date ON public.security_events(event_date);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view security events"
  ON public.security_events FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security staff can manage security events"
  ON public.security_events FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad', 'analista_seguridad', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- 3. Risk Zone History (audit trail)
CREATE TABLE public.risk_zone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  h3_index TEXT NOT NULL,
  previous_score NUMERIC,
  new_score NUMERIC,
  previous_risk_level TEXT,
  new_risk_level TEXT,
  change_type TEXT NOT NULL,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_zone_history_h3 ON public.risk_zone_history(h3_index);

ALTER TABLE public.risk_zone_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risk zone history"
  ON public.risk_zone_history FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security staff can insert risk zone history"
  ON public.risk_zone_history FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad', 'analista_seguridad')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- 4. Safe Points (certified stopping points)
CREATE TABLE public.safe_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  address TEXT,
  corridor_id TEXT,
  km_marker NUMERIC,
  has_security_guard BOOLEAN DEFAULT false,
  has_employees_24h BOOLEAN DEFAULT false,
  has_visible_cctv BOOLEAN DEFAULT false,
  has_military_nearby BOOLEAN DEFAULT false,
  is_well_lit BOOLEAN DEFAULT false,
  is_recognized_chain BOOLEAN DEFAULT false,
  has_perimeter_barrier BOOLEAN DEFAULT false,
  has_commercial_activity BOOLEAN DEFAULT false,
  truck_fits_inside BOOLEAN DEFAULT false,
  has_alternate_exit BOOLEAN DEFAULT false,
  has_restrooms BOOLEAN DEFAULT false,
  has_cell_signal BOOLEAN DEFAULT false,
  total_score INTEGER DEFAULT 0,
  certification_level TEXT DEFAULT 'precaucion',
  photo_url TEXT,
  notes TEXT,
  verification_status TEXT DEFAULT 'pending',
  reported_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safe_points_coords ON public.safe_points(lat, lng);
CREATE INDEX idx_safe_points_corridor ON public.safe_points(corridor_id);
CREATE INDEX idx_safe_points_certification ON public.safe_points(certification_level);

ALTER TABLE public.safe_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view safe points"
  ON public.safe_points FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security staff can manage safe points"
  ON public.safe_points FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad', 'analista_seguridad', 'coordinador_operaciones', 'custodio')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- 5. Protocolos de Seguridad
CREATE TABLE public.protocolos_seguridad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL,
  descripcion TEXT,
  checklist_items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.protocolos_seguridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view protocolos"
  ON public.protocolos_seguridad FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security admins can manage protocolos"
  ON public.protocolos_seguridad FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- 6. Capacitaciones de Seguridad
CREATE TABLE public.capacitaciones_seguridad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id UUID NOT NULL,
  nombre_capacitacion TEXT NOT NULL,
  fecha_completado DATE,
  fecha_vencimiento DATE,
  certificado_url TEXT,
  status TEXT DEFAULT 'pendiente',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_capacitaciones_custodio ON public.capacitaciones_seguridad(custodio_id);
CREATE INDEX idx_capacitaciones_vencimiento ON public.capacitaciones_seguridad(fecha_vencimiento);

ALTER TABLE public.capacitaciones_seguridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view capacitaciones"
  ON public.capacitaciones_seguridad FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Security admins can manage capacitaciones"
  ON public.capacitaciones_seguridad FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'jefe_seguridad', 'capacitacion_admin')
        AND (is_active IS NULL OR is_active = true)
    )
  );

-- ============================================================
-- RPC: Recalculate zone score based on events
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_zone_score(p_h3_index TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_score NUMERIC := 0;
  v_event_count INTEGER := 0;
  v_last_event_date DATE;
  v_risk_level TEXT;
  v_price_multiplier NUMERIC;
  v_previous_score NUMERIC;
  v_previous_level TEXT;
  v_severity_weight NUMERIC;
  v_days_ago NUMERIC;
  v_decay NUMERIC;
  v_event RECORD;
BEGIN
  -- Get previous values for history
  SELECT final_score, risk_level INTO v_previous_score, v_previous_level
  FROM risk_zone_scores WHERE h3_index = p_h3_index;

  -- Calculate score from events in last 180 days
  FOR v_event IN
    SELECT severity, event_date, verified
    FROM security_events
    WHERE h3_index = p_h3_index
      AND event_date >= CURRENT_DATE - INTERVAL '180 days'
    ORDER BY event_date DESC
  LOOP
    v_event_count := v_event_count + 1;
    
    -- Severity weights
    CASE v_event.severity
      WHEN 'critico' THEN v_severity_weight := 10;
      WHEN 'alto' THEN v_severity_weight := 6;
      WHEN 'medio' THEN v_severity_weight := 3;
      WHEN 'bajo' THEN v_severity_weight := 1;
      ELSE v_severity_weight := 1;
    END CASE;
    
    -- Verified bonus
    IF v_event.verified THEN
      v_severity_weight := v_severity_weight * 1.2;
    END IF;
    
    -- Temporal decay (events older = less weight)
    v_days_ago := EXTRACT(DAY FROM CURRENT_DATE - v_event.event_date);
    v_decay := GREATEST(0.1, 1.0 - (v_days_ago / 180.0));
    
    v_base_score := v_base_score + (v_severity_weight * v_decay);
    
    IF v_last_event_date IS NULL THEN
      v_last_event_date := v_event.event_date;
    END IF;
  END LOOP;
  
  -- Normalize score to 0-100
  v_base_score := LEAST(100, v_base_score);
  
  -- Determine risk level
  IF v_base_score >= 70 THEN v_risk_level := 'extremo';
  ELSIF v_base_score >= 40 THEN v_risk_level := 'alto';
  ELSIF v_base_score >= 15 THEN v_risk_level := 'medio';
  ELSE v_risk_level := 'bajo';
  END IF;
  
  -- Price multiplier
  CASE v_risk_level
    WHEN 'extremo' THEN v_price_multiplier := 1.8;
    WHEN 'alto' THEN v_price_multiplier := 1.4;
    WHEN 'medio' THEN v_price_multiplier := 1.15;
    ELSE v_price_multiplier := 1.0;
  END CASE;
  
  -- Upsert zone score
  INSERT INTO risk_zone_scores (h3_index, base_score, risk_level, price_multiplier, event_count, last_event_date, last_calculated_at)
  VALUES (p_h3_index, v_base_score, v_risk_level, v_price_multiplier, v_event_count, v_last_event_date, NOW())
  ON CONFLICT (h3_index)
  DO UPDATE SET
    base_score = EXCLUDED.base_score,
    risk_level = EXCLUDED.risk_level,
    price_multiplier = EXCLUDED.price_multiplier,
    event_count = EXCLUDED.event_count,
    last_event_date = EXCLUDED.last_event_date,
    last_calculated_at = NOW(),
    updated_at = NOW();
  
  -- Record history if score changed
  IF v_previous_score IS DISTINCT FROM v_base_score THEN
    INSERT INTO risk_zone_history (h3_index, previous_score, new_score, previous_risk_level, new_risk_level, change_type, change_reason)
    VALUES (p_h3_index, v_previous_score, v_base_score, v_previous_level, v_risk_level, 'recalculation', 
            'Recálculo automático basado en ' || v_event_count || ' eventos');
  END IF;
  
  RETURN jsonb_build_object(
    'h3_index', p_h3_index,
    'base_score', v_base_score,
    'risk_level', v_risk_level,
    'event_count', v_event_count,
    'price_multiplier', v_price_multiplier
  );
END;
$$;
