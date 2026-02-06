-- =====================================================
-- Integración Kapso WhatsApp - Fase 1
-- =====================================================

-- 1. Extender tabla whatsapp_configurations para Kapso
ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  kapso_phone_number_id TEXT;

ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  kapso_waba_id TEXT;

ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  integration_type TEXT DEFAULT 'kapso';

-- 2. Agregar delivery_status a whatsapp_messages
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  delivery_status TEXT DEFAULT 'sent';

-- 3. Agregar campos de confirmación a servicios_planificados
ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  estado_confirmacion_custodio TEXT;

ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  fecha_confirmacion TIMESTAMPTZ;

ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  requiere_reasignacion BOOLEAN DEFAULT false;

-- 4. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_type 
  ON whatsapp_configurations(integration_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_delivery 
  ON whatsapp_messages(message_id, delivery_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
  ON whatsapp_messages(chat_id, is_read) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_servicios_confirmacion 
  ON servicios_planificados(estado_confirmacion_custodio, fecha_confirmacion);

-- 5. Comentarios de documentación
COMMENT ON COLUMN whatsapp_configurations.kapso_phone_number_id IS 'ID del número de WhatsApp Business en Kapso';
COMMENT ON COLUMN whatsapp_configurations.kapso_waba_id IS 'ID de la cuenta de WhatsApp Business en Kapso';
COMMENT ON COLUMN whatsapp_configurations.integration_type IS 'Tipo de integración: kapso o legacy_baileys';
COMMENT ON COLUMN whatsapp_messages.delivery_status IS 'Estado de entrega: sent, delivered, read, failed';
COMMENT ON COLUMN servicios_planificados.estado_confirmacion_custodio IS 'Confirmación del custodio via WhatsApp: pendiente, confirmado, rechazado';
COMMENT ON COLUMN servicios_planificados.fecha_confirmacion IS 'Fecha/hora de confirmación del custodio';
COMMENT ON COLUMN servicios_planificados.requiere_reasignacion IS 'Indica si el servicio necesita ser reasignado';