-- Create escalation rules table
CREATE TABLE public.ticket_escalation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  condicion VARCHAR(50) NOT NULL CHECK (condicion IN ('sla_response_vencido', 'sla_resolution_vencido', 'sin_respuesta_24h', 'csat_bajo', 'ticket_reopen')),
  accion VARCHAR(50) NOT NULL CHECK (accion IN ('notificar', 'reasignar', 'escalar_supervisor', 'escalar_gerente')),
  destinatario_rol VARCHAR(50),
  notificar_email BOOLEAN DEFAULT true,
  notificar_app BOOLEAN DEFAULT true,
  prioridad_minima INTEGER DEFAULT 1,
  categoria_id UUID REFERENCES public.ticket_categorias_custodio(id),
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create response templates table if not exists
CREATE TABLE IF NOT EXISTS public.ticket_response_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  categoria_id UUID REFERENCES public.ticket_categorias_custodio(id),
  subcategoria_id UUID REFERENCES public.ticket_subcategorias_custodio(id),
  variables_disponibles TEXT[] DEFAULT ARRAY['nombre', 'ticket_number', 'fecha', 'monto', 'servicio'],
  activo BOOLEAN DEFAULT true,
  uso_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ticket_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_response_templates ENABLE ROW LEVEL SECURITY;

-- Policies for escalation rules
CREATE POLICY "Authenticated users can view escalation rules" 
  ON public.ticket_escalation_rules FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Admins can manage escalation rules" 
  ON public.ticket_escalation_rules FOR ALL 
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'bi')
    )
  );

-- Policies for response templates
CREATE POLICY "Authenticated users can view templates" 
  ON public.ticket_response_templates FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Admins can manage templates" 
  ON public.ticket_response_templates FOR ALL 
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'bi', 'supply_admin')
    )
  );

-- Add indexes
CREATE INDEX idx_escalation_rules_condicion ON public.ticket_escalation_rules(condicion) WHERE activo = true;
CREATE INDEX idx_escalation_rules_categoria ON public.ticket_escalation_rules(categoria_id) WHERE activo = true;
CREATE INDEX idx_templates_categoria ON public.ticket_response_templates(categoria_id) WHERE activo = true;
CREATE INDEX idx_templates_subcategoria ON public.ticket_response_templates(subcategoria_id) WHERE activo = true;

-- Insert default escalation rules
INSERT INTO public.ticket_escalation_rules (nombre, descripcion, condicion, accion, destinatario_rol, prioridad_minima, orden) VALUES
('SLA Respuesta Vencido', 'Escalar cuando el SLA de primera respuesta vence', 'sla_response_vencido', 'notificar', 'supervisor', 1, 1),
('SLA Resolución Vencido', 'Escalar cuando el SLA de resolución vence', 'sla_resolution_vencido', 'escalar_supervisor', 'supervisor', 1, 2),
('Sin Respuesta 24h', 'Notificar si ticket lleva 24h sin respuesta', 'sin_respuesta_24h', 'notificar', 'supervisor', 2, 3),
('CSAT Bajo', 'Escalar tickets con CSAT menor a 3', 'csat_bajo', 'escalar_gerente', 'gerente', 1, 4);

-- Insert default response templates
INSERT INTO public.ticket_response_templates (nombre, contenido, variables_disponibles) VALUES
('Saludo Inicial', 'Hola {{nombre}}, gracias por contactarnos. He recibido tu ticket #{{ticket_number}} y lo estoy revisando.', ARRAY['nombre', 'ticket_number']),
('Solicitud de Información', 'Hola {{nombre}}, para poder ayudarte con tu solicitud, necesito que me proporciones más información sobre el problema.', ARRAY['nombre']),
('En Proceso', 'Hola {{nombre}}, te informo que tu ticket #{{ticket_number}} está siendo procesado por el departamento correspondiente.', ARRAY['nombre', 'ticket_number']),
('Resolución Completada', 'Hola {{nombre}}, me complace informarte que tu ticket #{{ticket_number}} ha sido resuelto. Por favor confirma si el problema fue solucionado satisfactoriamente.', ARRAY['nombre', 'ticket_number']),
('Pago Procesado', 'Hola {{nombre}}, te confirmamos que tu solicitud de pago por ${{monto}} ha sido procesada y será reflejada en tu próximo corte.', ARRAY['nombre', 'monto']);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_escalation_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_escalation_rules_updated
  BEFORE UPDATE ON public.ticket_escalation_rules
  FOR EACH ROW EXECUTE FUNCTION update_escalation_rules_timestamp();

CREATE TRIGGER trg_templates_updated
  BEFORE UPDATE ON public.ticket_response_templates
  FOR EACH ROW EXECUTE FUNCTION update_escalation_rules_timestamp();