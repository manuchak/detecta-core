-- ============================================
-- FASE 1: Agregar columna is_test a tablas críticas
-- ============================================

-- Agregar columna is_test a tablas de reclutamiento
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE lead_approval_process ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_leads_is_test ON leads(is_test) WHERE is_test = TRUE;
CREATE INDEX IF NOT EXISTS idx_candidatos_is_test ON candidatos_custodios(is_test) WHERE is_test = TRUE;
CREATE INDEX IF NOT EXISTS idx_vapi_calls_is_test ON vapi_call_logs(is_test) WHERE is_test = TRUE;
CREATE INDEX IF NOT EXISTS idx_dialfire_calls_is_test ON dialfire_call_logs(is_test) WHERE is_test = TRUE;

-- Índices compuestos para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_leads_test_status ON leads(is_test, estado);
CREATE INDEX IF NOT EXISTS idx_leads_test_created ON leads(is_test, created_at DESC);

-- Comentarios para documentación
COMMENT ON COLUMN leads.is_test IS 'TRUE si el lead fue creado en modo Sandbox, FALSE para producción';
COMMENT ON COLUMN lead_approval_process.is_test IS 'TRUE si el proceso es de prueba, FALSE para producción';
COMMENT ON COLUMN vapi_call_logs.is_test IS 'TRUE si la llamada VAPI es de prueba, FALSE para producción';

-- ============================================
-- FASE 3: Actualizar RPC Functions para respetar is_test
-- ============================================

-- Eliminar función existente para poder recrearla con nueva lógica
DROP FUNCTION IF EXISTS update_vapi_call_with_results(text,text,integer,text,text,jsonb,numeric,text,numeric);

-- Modificar update_vapi_call_with_results para validar ambiente
CREATE FUNCTION update_vapi_call_with_results(
  p_vapi_call_id TEXT,
  p_call_status TEXT,
  p_duration_seconds INTEGER,
  p_transcript TEXT,
  p_summary TEXT,
  p_structured_data JSONB,
  p_analysis_score NUMERIC,
  p_recording_url TEXT,
  p_cost_usd NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id TEXT;
  v_is_test BOOLEAN;
BEGIN
  -- Obtener lead_id e is_test del call log
  SELECT lead_id, is_test 
  INTO v_lead_id, v_is_test
  FROM vapi_call_logs
  WHERE vapi_call_id = p_vapi_call_id;
  
  IF v_lead_id IS NULL THEN
    RAISE EXCEPTION 'Call log not found for vapi_call_id: %', p_vapi_call_id;
  END IF;
  
  -- Actualizar call log
  UPDATE vapi_call_logs SET
    call_status = p_call_status,
    duration_seconds = p_duration_seconds,
    transcript = p_transcript,
    summary = p_summary,
    structured_data = p_structured_data,
    analysis_score = p_analysis_score,
    recording_url = p_recording_url,
    cost_usd = p_cost_usd,
    updated_at = NOW()
  WHERE vapi_call_id = p_vapi_call_id;
  
  -- ⚠️ SEGURIDAD CRÍTICA: Solo actualizar lead del mismo ambiente
  -- Si la llamada es test, solo actualizar leads test
  -- Si es producción, solo actualizar leads producción
  UPDATE leads SET
    interview_data = p_structured_data,
    interview_completed = TRUE,
    interview_transcript = p_transcript,
    interview_summary = p_summary,
    analysis_score = p_analysis_score,
    auto_decision = (p_structured_data->>'auto_decision')::TEXT,
    updated_at = NOW()
  WHERE id = v_lead_id
    AND is_test = v_is_test; -- PROTECCIÓN: Validar ambiente
  
  -- Log de auditoría si no se encontró el lead
  IF NOT FOUND THEN
    RAISE WARNING 'Lead % not updated - environment mismatch (is_test: %)', v_lead_id, v_is_test;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_vapi_call_with_results IS 
'Actualiza resultados de llamada VAPI respetando aislamiento Sandbox/Producción vía is_test';

-- Crear función helper para crear leads desde webhooks
CREATE OR REPLACE FUNCTION create_lead_from_webhook(
  p_nombre TEXT,
  p_telefono TEXT,
  p_email TEXT,
  p_fuente TEXT,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  INSERT INTO leads (
    nombre,
    telefono,
    email,
    fuente,
    estado,
    is_test,
    created_at
  ) VALUES (
    p_nombre,
    p_telefono,
    p_email,
    p_fuente,
    'nuevo',
    p_is_test,
    NOW()
  )
  RETURNING id INTO v_lead_id;
  
  RETURN v_lead_id;
END;
$$;

COMMENT ON FUNCTION create_lead_from_webhook IS 
'Crea nuevo lead desde webhook respetando flag is_test para aislamiento Sandbox/Producción';