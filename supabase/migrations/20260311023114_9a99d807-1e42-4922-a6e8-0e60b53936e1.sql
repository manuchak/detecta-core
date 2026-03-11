ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS sent_by_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_sent_by ON whatsapp_messages(sent_by_user_id)
  WHERE sent_by_user_id IS NOT NULL;