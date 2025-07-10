-- Crear tabla para configuraciones de WhatsApp
CREATE TABLE public.whatsapp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE,
  is_active BOOLEAN DEFAULT false,
  qr_code TEXT,
  session_data JSONB,
  connection_status TEXT DEFAULT 'disconnected',
  last_connected_at TIMESTAMP WITH TIME ZONE,
  welcome_message TEXT DEFAULT 'Hola! 👋 Soy el asistente virtual de Detecta Security. ¿En qué puedo ayudarte?',
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  auto_reply_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Crear tabla para sesiones de WhatsApp
CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  session_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(phone_number, chat_id)
);

-- Crear tabla para tickets (mejorada)
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT 'TK-' || extract(epoch from now())::bigint,
  customer_phone TEXT,
  customer_name TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES auth.users(id),
  source TEXT DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'web', 'email', 'telefono')),
  whatsapp_chat_id TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Crear tabla para mensajes de WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id),
  chat_id TEXT NOT NULL,
  message_id TEXT,
  sender_phone TEXT,
  sender_name TEXT,
  message_text TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document', 'location')),
  media_url TEXT,
  is_from_bot BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para plantillas de respuesta
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.whatsapp_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_configurations
CREATE POLICY "Admins can manage WhatsApp config" ON public.whatsapp_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
    )
  );

-- Políticas RLS para whatsapp_sessions
CREATE POLICY "Service can manage WhatsApp sessions" ON public.whatsapp_sessions
  FOR ALL USING (true);

-- Políticas RLS para tickets
CREATE POLICY "Users can view tickets" ON public.tickets
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'soporte')
    )
  );

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Assigned users can update tickets" ON public.tickets
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'soporte')
    )
  );

-- Políticas RLS para whatsapp_messages
CREATE POLICY "Users can view messages for their tickets" ON public.whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = whatsapp_messages.ticket_id
      AND (t.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM public.user_roles ur
             WHERE ur.user_id = auth.uid() 
             AND ur.role IN ('admin', 'owner', 'manager', 'soporte')
           ))
    )
  );

CREATE POLICY "Service can manage messages" ON public.whatsapp_messages
  FOR ALL USING (true);

-- Políticas RLS para whatsapp_templates
CREATE POLICY "Users can view templates" ON public.whatsapp_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'soporte')
    )
  );

CREATE POLICY "Admins can manage templates" ON public.whatsapp_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
    )
  );

-- Crear triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_configurations_updated_at
  BEFORE UPDATE ON public.whatsapp_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar plantillas de respuesta por defecto
INSERT INTO public.whatsapp_templates (name, content, category) VALUES
('bienvenida', 'Hola! 👋 Soy el asistente virtual de Detecta Security. ¿En qué puedo ayudarte?', 'general'),
('menu_principal', '¿Cómo puedo ayudarte hoy?\n\n1️⃣ Consultar estado de servicio\n2️⃣ Reportar una incidencia\n3️⃣ Soporte técnico\n4️⃣ Hablar con un agente\n\nEscribe el número de la opción que necesitas.', 'menu'),
('fuera_horario', 'Gracias por contactarnos. Nuestro horario de atención es de 9:00 AM a 6:00 PM. Tu mensaje es importante para nosotros y te responderemos en el siguiente horario hábil.', 'automatico'),
('escalamiento', 'Te conectaré con un agente humano. Por favor espera un momento...', 'escalamiento'),
('ticket_creado', 'He creado el ticket #{ticket_number} para tu consulta. Uno de nuestros agentes te contactará pronto.', 'confirmacion');