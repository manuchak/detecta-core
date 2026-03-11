ALTER TABLE whatsapp_messages 
DROP CONSTRAINT whatsapp_messages_message_type_check;

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_message_type_check 
CHECK (message_type = ANY (ARRAY['text', 'image', 'audio', 'document', 'location', 'template']));