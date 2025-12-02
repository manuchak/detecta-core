
-- =====================================================
-- SPRINT 1: State Machine + Entrevistas Estructuradas + Risk Checklists
-- =====================================================

-- 1. Agregar estado detallado a candidatos_custodios
ALTER TABLE candidatos_custodios 
ADD COLUMN IF NOT EXISTS estado_detallado VARCHAR(50) DEFAULT 'lead';

-- Actualizar estados existentes basados en estado_proceso
UPDATE candidatos_custodios 
SET estado_detallado = CASE 
  WHEN estado_proceso = 'lead' THEN 'lead'
  WHEN estado_proceso = 'contactado' THEN 'contactado'
  WHEN estado_proceso = 'entrevista' THEN 'entrevista_programada'
  WHEN estado_proceso = 'documentacion' THEN 'validacion_documentos'
  WHEN estado_proceso = 'aprobado' THEN 'aprobado_final'
  WHEN estado_proceso = 'activo' THEN 'activo'
  WHEN estado_proceso = 'rechazado' THEN 'rechazado'
  ELSE 'lead'
END
WHERE estado_detallado IS NULL OR estado_detallado = 'lead';

-- 2. Tabla de transiciones de estado
CREATE TABLE IF NOT EXISTS custodio_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  from_state VARCHAR(50),
  to_state VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para transiciones
CREATE INDEX IF NOT EXISTS idx_state_transitions_candidato ON custodio_state_transitions(candidato_id);
CREATE INDEX IF NOT EXISTS idx_state_transitions_created ON custodio_state_transitions(created_at DESC);

-- 3. Tabla de entrevistas estructuradas
CREATE TABLE IF NOT EXISTS entrevistas_estructuradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  entrevistador_id UUID REFERENCES auth.users(id),
  
  -- Ratings 1-5 para cada dimensión
  rating_comunicacion INTEGER CHECK (rating_comunicacion BETWEEN 1 AND 5),
  rating_actitud INTEGER CHECK (rating_actitud BETWEEN 1 AND 5),
  rating_experiencia INTEGER CHECK (rating_experiencia BETWEEN 1 AND 5),
  rating_disponibilidad INTEGER CHECK (rating_disponibilidad BETWEEN 1 AND 5),
  rating_motivacion INTEGER CHECK (rating_motivacion BETWEEN 1 AND 5),
  rating_profesionalismo INTEGER CHECK (rating_profesionalismo BETWEEN 1 AND 5),
  
  -- Promedio calculado
  rating_promedio NUMERIC(3,2),
  
  -- Notas y observaciones
  notas_generales TEXT,
  fortalezas TEXT[] DEFAULT '{}',
  areas_mejora TEXT[] DEFAULT '{}',
  
  -- Decisión
  decision VARCHAR(20) CHECK (decision IN ('aprobar', 'rechazar', 'segunda_entrevista', 'pendiente')),
  motivo_decision TEXT,
  
  -- Metadata
  tipo_entrevista VARCHAR(30) DEFAULT 'inicial', -- 'inicial', 'segunda', 'tecnica'
  duracion_minutos INTEGER,
  fecha_entrevista TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para entrevistas
CREATE INDEX IF NOT EXISTS idx_entrevistas_candidato ON entrevistas_estructuradas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_entrevistas_fecha ON entrevistas_estructuradas(fecha_entrevista DESC);

-- Trigger para calcular promedio automáticamente
CREATE OR REPLACE FUNCTION calculate_interview_rating_average()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rating_promedio := (
    COALESCE(NEW.rating_comunicacion, 0) + 
    COALESCE(NEW.rating_actitud, 0) + 
    COALESCE(NEW.rating_experiencia, 0) + 
    COALESCE(NEW.rating_disponibilidad, 0) + 
    COALESCE(NEW.rating_motivacion, 0) + 
    COALESCE(NEW.rating_profesionalismo, 0)
  )::NUMERIC / NULLIF(
    (CASE WHEN NEW.rating_comunicacion IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.rating_actitud IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.rating_experiencia IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.rating_disponibilidad IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.rating_motivacion IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.rating_profesionalismo IS NOT NULL THEN 1 ELSE 0 END)
  , 0);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_interview_average ON entrevistas_estructuradas;
CREATE TRIGGER trigger_calculate_interview_average
  BEFORE INSERT OR UPDATE ON entrevistas_estructuradas
  FOR EACH ROW
  EXECUTE FUNCTION calculate_interview_rating_average();

-- 4. Tabla de checklist de riesgo
CREATE TABLE IF NOT EXISTS candidato_risk_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE UNIQUE,
  
  -- Antecedentes
  antecedentes_penales BOOLEAN DEFAULT FALSE,
  antecedentes_laborales_negativos BOOLEAN DEFAULT FALSE,
  inconsistencias_cv BOOLEAN DEFAULT FALSE,
  
  -- Comportamiento en entrevista
  actitud_defensiva BOOLEAN DEFAULT FALSE,
  respuestas_evasivas BOOLEAN DEFAULT FALSE,
  nerviosismo_excesivo BOOLEAN DEFAULT FALSE,
  
  -- Red flags
  cambios_frecuentes_empleo BOOLEAN DEFAULT FALSE,
  referencias_no_verificables BOOLEAN DEFAULT FALSE,
  documentacion_incompleta BOOLEAN DEFAULT FALSE,
  zona_alto_riesgo BOOLEAN DEFAULT FALSE,
  
  -- Score y nivel calculados
  risk_score INTEGER DEFAULT 0,
  risk_level VARCHAR(10) DEFAULT 'bajo',
  
  notas TEXT,
  evaluado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para calcular risk_score y risk_level
CREATE OR REPLACE FUNCTION calculate_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.risk_score := 
    (CASE WHEN NEW.antecedentes_penales THEN 30 ELSE 0 END) +
    (CASE WHEN NEW.antecedentes_laborales_negativos THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.inconsistencias_cv THEN 15 ELSE 0 END) +
    (CASE WHEN NEW.actitud_defensiva THEN 10 ELSE 0 END) +
    (CASE WHEN NEW.respuestas_evasivas THEN 10 ELSE 0 END) +
    (CASE WHEN NEW.nerviosismo_excesivo THEN 5 ELSE 0 END) +
    (CASE WHEN NEW.cambios_frecuentes_empleo THEN 5 ELSE 0 END) +
    (CASE WHEN NEW.referencias_no_verificables THEN 15 ELSE 0 END) +
    (CASE WHEN NEW.documentacion_incompleta THEN 10 ELSE 0 END) +
    (CASE WHEN NEW.zona_alto_riesgo THEN 10 ELSE 0 END);
    
  NEW.risk_level := CASE 
    WHEN NEW.risk_score >= 50 THEN 'alto'
    WHEN NEW.risk_score >= 25 THEN 'medio'
    ELSE 'bajo'
  END;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_risk_score ON candidato_risk_checklist;
CREATE TRIGGER trigger_calculate_risk_score
  BEFORE INSERT OR UPDATE ON candidato_risk_checklist
  FOR EACH ROW
  EXECUTE FUNCTION calculate_risk_score();

-- 5. Tabla de feature flags para Supply
CREATE TABLE IF NOT EXISTS supply_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  flag_value BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar feature flags iniciales
INSERT INTO supply_feature_flags (flag_key, flag_value, description) VALUES
  ('REQUIRE_STRUCTURED_INTERVIEW', false, 'Requiere entrevista estructurada antes de aprobar'),
  ('REQUIRE_RISK_CHECKLIST', false, 'Requiere checklist de riesgo antes de aprobar'),
  ('ENFORCE_STATE_TRANSITIONS', false, 'Forzar transiciones de estado válidas'),
  ('BLOCK_HIGH_RISK_CANDIDATES', false, 'Bloquear aprobación de candidatos con riesgo alto')
ON CONFLICT (flag_key) DO NOTHING;

-- 6. RPC para transición de estados con validación
CREATE OR REPLACE FUNCTION transition_candidato_state(
  p_candidato_id UUID,
  p_new_state VARCHAR(50),
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_state VARCHAR(50);
  v_valid_transitions JSONB;
  v_enforce_transitions BOOLEAN;
BEGIN
  -- Obtener estado actual
  SELECT estado_detallado INTO v_current_state
  FROM candidatos_custodios
  WHERE id = p_candidato_id;
  
  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidato no encontrado');
  END IF;
  
  -- Verificar si debemos validar transiciones
  SELECT flag_value INTO v_enforce_transitions
  FROM supply_feature_flags
  WHERE flag_key = 'ENFORCE_STATE_TRANSITIONS';
  
  -- Definir transiciones válidas
  v_valid_transitions := '{
    "lead": ["contactado", "rechazado"],
    "contactado": ["entrevista_programada", "rechazado"],
    "entrevista_programada": ["entrevista_en_progreso", "rechazado"],
    "entrevista_en_progreso": ["entrevista_completada", "rechazado"],
    "entrevista_completada": ["evaluacion_psicometrica", "segunda_entrevista", "rechazado"],
    "segunda_entrevista": ["evaluacion_psicometrica", "rechazado"],
    "evaluacion_psicometrica": ["evaluacion_toxicologica", "rechazado"],
    "evaluacion_toxicologica": ["validacion_referencias", "rechazado"],
    "validacion_referencias": ["validacion_documentos", "rechazado"],
    "validacion_documentos": ["capacitacion", "rechazado"],
    "capacitacion": ["instalacion_tecnica", "rechazado"],
    "instalacion_tecnica": ["aprobado_final", "rechazado"],
    "aprobado_final": ["en_liberacion", "rechazado"],
    "en_liberacion": ["activo", "rechazado"],
    "rechazado": ["lead"]
  }'::JSONB;
  
  -- Validar transición si está habilitado
  IF v_enforce_transitions AND NOT (
    v_valid_transitions->v_current_state ? p_new_state
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Transición inválida: %s -> %s', v_current_state, p_new_state),
      'valid_transitions', v_valid_transitions->v_current_state
    );
  END IF;
  
  -- Registrar transición
  INSERT INTO custodio_state_transitions (
    candidato_id, from_state, to_state, changed_by, reason, metadata
  ) VALUES (
    p_candidato_id, v_current_state, p_new_state, auth.uid(), p_reason, p_metadata
  );
  
  -- Actualizar estado
  UPDATE candidatos_custodios
  SET estado_detallado = p_new_state,
      updated_at = NOW()
  WHERE id = p_candidato_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'from_state', v_current_state,
    'to_state', p_new_state
  );
END;
$$;

-- 7. RLS Policies
ALTER TABLE custodio_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrevistas_estructuradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidato_risk_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies para state_transitions
CREATE POLICY "state_transitions_select_supply" ON custodio_state_transitions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones'))
  );

CREATE POLICY "state_transitions_insert_supply" ON custodio_state_transitions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead'))
  );

-- Policies para entrevistas_estructuradas
CREATE POLICY "entrevistas_select_supply" ON entrevistas_estructuradas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones'))
  );

CREATE POLICY "entrevistas_insert_supply" ON entrevistas_estructuradas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead'))
  );

CREATE POLICY "entrevistas_update_supply" ON entrevistas_estructuradas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead'))
  );

-- Policies para risk_checklist
CREATE POLICY "risk_checklist_select_supply" ON candidato_risk_checklist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones'))
  );

CREATE POLICY "risk_checklist_insert_supply" ON candidato_risk_checklist
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead'))
  );

CREATE POLICY "risk_checklist_update_supply" ON candidato_risk_checklist
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead'))
  );

-- Policies para feature_flags
CREATE POLICY "feature_flags_select_all" ON supply_feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "feature_flags_manage_admin" ON supply_feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner'))
  );

-- 8. Vista para métricas de entrevistas
CREATE OR REPLACE VIEW v_interview_metrics AS
SELECT 
  DATE_TRUNC('week', fecha_entrevista) as semana,
  COUNT(*) as total_entrevistas,
  AVG(rating_promedio) as promedio_general,
  COUNT(*) FILTER (WHERE decision = 'aprobar') as aprobados,
  COUNT(*) FILTER (WHERE decision = 'rechazar') as rechazados,
  COUNT(*) FILTER (WHERE decision = 'segunda_entrevista') as segunda_entrevista,
  AVG(duracion_minutos) as duracion_promedio
FROM entrevistas_estructuradas
GROUP BY DATE_TRUNC('week', fecha_entrevista)
ORDER BY semana DESC;

-- Hacer la vista SECURITY INVOKER
ALTER VIEW v_interview_metrics SET (security_invoker = true);
