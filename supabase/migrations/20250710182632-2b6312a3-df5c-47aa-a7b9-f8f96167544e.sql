-- Crear tabla para configuraciones de WhatsApp
CREATE TABLE public.whatsapp_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connection_status TEXT NOT NULL DEFAULT 'disconnected',
  welcome_message TEXT NOT NULL DEFAULT 'Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
  business_hours_start TIME NOT NULL DEFAULT '09:00',
  business_hours_end TIME NOT NULL DEFAULT '18:00',
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_configurations ENABLE ROW LEVEL SECURITY;

-- Política para administradores
CREATE POLICY "Admins can manage WhatsApp configurations" 
ON public.whatsapp_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_whatsapp_configurations_updated_at
  BEFORE UPDATE ON public.whatsapp_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();