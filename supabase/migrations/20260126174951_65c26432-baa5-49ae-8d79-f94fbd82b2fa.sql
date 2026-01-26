-- 1. Etapas del pipeline
CREATE TABLE crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pipeline_name TEXT DEFAULT 'Default',
  order_nr INTEGER DEFAULT 0,
  deal_probability INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Deals/Oportunidades
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  organization_name TEXT,
  person_name TEXT,
  person_email TEXT,
  person_phone TEXT,
  value NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  stage_id UUID REFERENCES crm_pipeline_stages(id),
  status TEXT DEFAULT 'open',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  won_time TIMESTAMPTZ,
  lost_time TIMESTAMPTZ,
  lost_reason TEXT,
  owner_name TEXT,
  owner_id INTEGER,
  pipedrive_data JSONB,
  matched_client_name TEXT,
  match_confidence NUMERIC(3,2),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Historial de cambios de etapa
CREATE TABLE crm_deal_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE NOT NULL,
  from_stage_id UUID REFERENCES crm_pipeline_stages(id),
  to_stage_id UUID REFERENCES crm_pipeline_stages(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  time_in_previous_stage INTERVAL
);

-- 4. Actividades comerciales
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipedrive_id INTEGER UNIQUE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  subject TEXT,
  done BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  note TEXT,
  owner_name TEXT,
  pipedrive_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Log de webhooks para debugging
CREATE TABLE crm_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_crm_deals_status ON crm_deals(status);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX idx_crm_deals_org_name ON crm_deals(organization_name);
CREATE INDEX idx_crm_deals_pipedrive_id ON crm_deals(pipedrive_id);
CREATE INDEX idx_crm_webhook_logs_created ON crm_webhook_logs(created_at DESC);
CREATE INDEX idx_crm_deal_stage_history_deal ON crm_deal_stage_history(deal_id);

-- RLS Policies
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Pipeline stages visible para usuarios autenticados
CREATE POLICY "Pipeline stages visible to authenticated" ON crm_pipeline_stages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Deals visible para roles comerciales
CREATE POLICY "CRM deals visible to authorized roles" ON crm_deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

-- Stage history visible para roles comerciales
CREATE POLICY "Stage history visible to authorized roles" ON crm_deal_stage_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

-- Activities visible para roles comerciales
CREATE POLICY "Activities visible to authorized roles" ON crm_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi')
    )
  );

-- Webhook logs solo para admins
CREATE POLICY "Webhook logs visible to admins" ON crm_webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Políticas de INSERT para el service role (Edge Functions)
CREATE POLICY "Service role can insert pipeline stages" ON crm_pipeline_stages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert deals" ON crm_deals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update deals" ON crm_deals
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert stage history" ON crm_deal_stage_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert activities" ON crm_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert webhook logs" ON crm_webhook_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update webhook logs" ON crm_webhook_logs
  FOR UPDATE USING (true);

-- Insert de etapas iniciales de pipeline (valores típicos de Pipedrive)
INSERT INTO crm_pipeline_stages (pipedrive_id, name, order_nr, deal_probability) VALUES
(1, 'Lead In', 1, 10),
(2, 'Contactado', 2, 20),
(3, 'Propuesta Enviada', 3, 40),
(4, 'Negociación', 4, 60),
(5, 'Cierre', 5, 80);

-- Vista para forecast
CREATE OR REPLACE VIEW crm_forecast_view AS
SELECT 
  s.id as stage_id,
  s.name as stage_name,
  s.order_nr,
  s.deal_probability,
  COUNT(d.id) as deals_count,
  COALESCE(SUM(d.value), 0) as total_value,
  COALESCE(SUM(d.value * s.deal_probability / 100), 0) as weighted_value
FROM crm_pipeline_stages s
LEFT JOIN crm_deals d ON d.stage_id = s.id AND d.status = 'open' AND d.is_deleted = false
WHERE s.is_active = true
GROUP BY s.id, s.name, s.order_nr, s.deal_probability
ORDER BY s.order_nr;