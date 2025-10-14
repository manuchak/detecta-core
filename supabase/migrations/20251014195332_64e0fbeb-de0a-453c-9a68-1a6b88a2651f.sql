-- ============================================
-- SANDBOX INFRASTRUCTURE - Fixed Audit
-- ============================================

-- 1. Modificar función de auditoría para permitir operaciones del sistema
CREATE OR REPLACE FUNCTION public.audit_sensitive_access(
  table_name text,
  operation text,
  record_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Solo auditar si hay un usuario autenticado (skip para operaciones del sistema)
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.audit_log_productos (
      usuario_id,
      accion,
      producto_id,
      motivo,
      datos_nuevos
    ) VALUES (
      current_user_id,
      operation || ' on ' || table_name,
      COALESCE(record_id, gen_random_uuid()),
      'Security audit: sensitive data access',
      jsonb_build_object(
        'table', table_name,
        'operation', operation,
        'timestamp', now(),
        'user_id', current_user_id,
        'user_role', (SELECT role FROM public.user_roles WHERE user_id = current_user_id LIMIT 1)
      )
    );
  END IF;
END;
$$;

-- 2. Agregar columnas is_test
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE vapi_call_logs ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE manual_call_logs ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- 3. Crear tabla dialfire_call_logs
CREATE TABLE IF NOT EXISTS dialfire_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  campaign_id TEXT,
  call_duration INTEGER,
  call_outcome TEXT,
  agent_id TEXT,
  agent_notes TEXT,
  dialfire_call_id TEXT UNIQUE,
  phone_number TEXT,
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla sandbox_promotions
CREATE TABLE IF NOT EXISTS sandbox_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  test_results JSONB DEFAULT '{}'::jsonb,
  validation_criteria JSONB DEFAULT '{}'::jsonb,
  deployment_strategy TEXT DEFAULT 'gradual',
  current_phase INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approval_justification TEXT,
  deployment_started_at TIMESTAMPTZ,
  deployment_completed_at TIMESTAMPTZ,
  rollback_date TIMESTAMPTZ,
  rollback_reason TEXT,
  live_metrics JSONB DEFAULT '{}'::jsonb,
  error_log TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_candidatos_is_test ON candidatos_custodios(is_test);
CREATE INDEX IF NOT EXISTS idx_vapi_is_test ON vapi_call_logs(is_test);
CREATE INDEX IF NOT EXISTS idx_manual_is_test ON manual_call_logs(is_test);
CREATE INDEX IF NOT EXISTS idx_dialfire_is_test ON dialfire_call_logs(is_test);
CREATE INDEX IF NOT EXISTS idx_dialfire_candidato ON dialfire_call_logs(candidato_id);
CREATE INDEX IF NOT EXISTS idx_dialfire_call_id ON dialfire_call_logs(dialfire_call_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON sandbox_promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_created ON sandbox_promotions(created_at DESC);

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dialfire_logs_updated
  BEFORE UPDATE ON dialfire_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER promotions_updated
  BEFORE UPDATE ON sandbox_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- 7. RLS Policies
ALTER TABLE dialfire_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dialfire_select" ON dialfire_call_logs
  FOR SELECT
  USING (
    user_has_role_direct('admin'::text) OR 
    user_has_role_direct('owner'::text) OR 
    user_has_role_direct('supply_admin'::text)
  );

CREATE POLICY "dialfire_insert" ON dialfire_call_logs
  FOR INSERT
  WITH CHECK (
    user_has_role_direct('admin'::text) OR 
    user_has_role_direct('owner'::text) OR
    user_has_role_direct('supply_admin'::text)
  );

CREATE POLICY "promotions_select" ON sandbox_promotions
  FOR SELECT
  USING (
    user_has_role_direct('admin'::text) OR 
    user_has_role_direct('owner'::text)
  );

CREATE POLICY "promotions_insert" ON sandbox_promotions
  FOR INSERT
  WITH CHECK (
    (user_has_role_direct('admin'::text) OR user_has_role_direct('owner'::text))
    AND created_by = auth.uid()
  );

CREATE POLICY "promotions_update" ON sandbox_promotions
  FOR UPDATE
  USING (
    user_has_role_direct('admin'::text) OR 
    user_has_role_direct('owner'::text)
  );

-- 8. Función para métricas
CREATE OR REPLACE FUNCTION get_sandbox_metrics(
  p_is_test BOOLEAN DEFAULT TRUE,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vapi_metrics JSONB;
  dialfire_metrics JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_calls', COUNT(*),
    'successful_calls', COUNT(*) FILTER (WHERE call_status = 'completed'),
    'success_rate', ROUND((COUNT(*) FILTER (WHERE call_status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    'avg_duration', ROUND(AVG(duration_seconds), 2),
    'total_cost', ROUND(SUM(COALESCE(cost_usd, 0)), 2)
  ) INTO vapi_metrics
  FROM vapi_call_logs
  WHERE is_test = p_is_test
    AND created_at >= p_start_date;

  SELECT jsonb_build_object(
    'total_calls', COUNT(*),
    'successful_calls', COUNT(*) FILTER (WHERE call_outcome = 'answered'),
    'success_rate', ROUND((COUNT(*) FILTER (WHERE call_outcome = 'answered')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    'avg_duration', ROUND(AVG(call_duration), 2)
  ) INTO dialfire_metrics
  FROM dialfire_call_logs
  WHERE is_test = p_is_test
    AND created_at >= p_start_date;

  RETURN jsonb_build_object(
    'vapi', COALESCE(vapi_metrics, '{}'::jsonb),
    'dialfire', COALESCE(dialfire_metrics, '{}'::jsonb),
    'period_start', p_start_date,
    'period_end', NOW()
  );
END;
$$;

-- 9. Insertar candidatos de prueba
INSERT INTO candidatos_custodios (
  nombre, telefono, email, 
  fuente_reclutamiento, estado_proceso, is_test
)
SELECT 
  'Test Candidato ' || generate_series,
  '+52155' || LPAD(generate_series::TEXT, 8, '0'),
  'test' || generate_series || '@guardexpress.test',
  'sandbox_testing',
  'lead',
  TRUE
FROM generate_series(1, 20)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE dialfire_call_logs IS 'Logs de llamadas Dialfire (marcador predictivo)';
COMMENT ON TABLE sandbox_promotions IS 'Tracking de promociones sandbox->prod';