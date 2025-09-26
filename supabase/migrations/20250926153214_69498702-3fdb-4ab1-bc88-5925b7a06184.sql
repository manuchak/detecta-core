-- Crear tabla para notificaciones de servicios
CREATE TABLE public.service_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('custodian', 'customer')),
  recipient_phone TEXT,
  recipient_name TEXT,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for service notifications
CREATE POLICY "Admins can manage service notifications"
ON public.service_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_service_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_service_notifications_updated_at
  BEFORE UPDATE ON public.service_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_notifications_updated_at();