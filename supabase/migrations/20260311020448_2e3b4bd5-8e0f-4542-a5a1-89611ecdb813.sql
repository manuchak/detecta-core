
-- Phase 1: WhatsApp Communications for Bitácora

-- 1. Add servicio_id and is_read to whatsapp_messages
ALTER TABLE public.whatsapp_messages 
  ADD COLUMN IF NOT EXISTS servicio_id UUID REFERENCES public.servicios_planificados(id),
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_servicio_id 
  ON public.whatsapp_messages(servicio_id) WHERE servicio_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
  ON public.whatsapp_messages(servicio_id, is_read) WHERE servicio_id IS NOT NULL AND is_read = false;

-- 2. Create servicio_comm_media table
CREATE TABLE IF NOT EXISTS public.servicio_comm_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES public.servicios_planificados(id) ON DELETE CASCADE,
  whatsapp_message_id UUID REFERENCES public.whatsapp_messages(id),
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  original_media_id TEXT,
  validado BOOLEAN NOT NULL DEFAULT false,
  validado_por UUID REFERENCES auth.users(id),
  validado_at TIMESTAMPTZ,
  enviado_a_cliente BOOLEAN NOT NULL DEFAULT false,
  enviado_a_cliente_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicio_comm_media_servicio 
  ON public.servicio_comm_media(servicio_id);

ALTER TABLE public.servicio_comm_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_read_comm_media" ON public.servicio_comm_media
  FOR SELECT TO authenticated
  USING (public.has_monitoring_role());

CREATE POLICY "monitoring_write_comm_media" ON public.servicio_comm_media
  FOR INSERT TO authenticated
  WITH CHECK (public.has_monitoring_write_role());

CREATE POLICY "monitoring_update_comm_media" ON public.servicio_comm_media
  FOR UPDATE TO authenticated
  USING (public.has_monitoring_write_role())
  WITH CHECK (public.has_monitoring_write_role());

-- 3. Add contacto_whatsapp to pc_clientes
ALTER TABLE public.pc_clientes 
  ADD COLUMN IF NOT EXISTS contacto_whatsapp TEXT;

-- 4. Create whatsapp-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-media', 'whatsapp-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users with monitoring role can upload
CREATE POLICY "monitoring_upload_wa_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'whatsapp-media' AND public.has_monitoring_role());

CREATE POLICY "public_read_wa_media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'whatsapp-media');

-- 5. Enable realtime on whatsapp_messages for servicio_id filtering
ALTER PUBLICATION supabase_realtime ADD TABLE public.servicio_comm_media;
