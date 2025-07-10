-- Crear tabla para sesiones de WhatsApp con Baileys
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  session_data JSONB,
  auth_state JSONB,
  qr_code TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan acceder
CREATE POLICY "Solo admins pueden gestionar sesiones WhatsApp"
ON whatsapp_sessions FOR ALL
USING (is_whatsapp_admin())
WITH CHECK (is_whatsapp_admin());

-- Crear tabla para logs de conexión
CREATE TABLE IF NOT EXISTS whatsapp_connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'connected', 'disconnected', 'qr_generated', 'error'
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para logs
ALTER TABLE whatsapp_connection_logs ENABLE ROW LEVEL SECURITY;

-- Política para logs
CREATE POLICY "Solo admins pueden ver logs WhatsApp"
ON whatsapp_connection_logs FOR SELECT
USING (is_whatsapp_admin());

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_sessions_updated_at();