
-- Fase Dev 1: Modelo de datos para comunicación multi-canal
-- Agregar columnas de clasificación a whatsapp_messages

ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS comm_channel text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS comm_phase text NOT NULL DEFAULT 'sin_servicio',
  ADD COLUMN IF NOT EXISTS sender_type text NOT NULL DEFAULT 'unknown';

-- Índice compuesto para queries filtradas por canal dentro de un servicio
CREATE INDEX IF NOT EXISTS idx_wm_servicio_channel
  ON whatsapp_messages(servicio_id, comm_channel)
  WHERE servicio_id IS NOT NULL;

-- Índice para búsqueda de mensajes de cliente por canal
CREATE INDEX IF NOT EXISTS idx_wm_channel_sender
  ON whatsapp_messages(comm_channel, sender_type)
  WHERE comm_channel = 'cliente_c4';

-- Backfill: mensajes existentes con servicio_id → custodio_c4
UPDATE whatsapp_messages
SET comm_channel = 'custodio_c4',
    comm_phase = 'en_servicio',
    sender_type = CASE
      WHEN is_from_bot THEN 'staff'
      ELSE 'custodio'
    END
WHERE servicio_id IS NOT NULL AND comm_channel = 'unknown';

-- Backfill: mensajes sin servicio (tickets)
UPDATE whatsapp_messages
SET sender_type = CASE WHEN is_from_bot THEN 'staff' ELSE 'custodio' END,
    comm_phase = 'sin_servicio'
WHERE servicio_id IS NULL AND sender_type = 'unknown';
