-- =====================================================
-- BASE DE CONOCIMIENTO PARA BOT DE ASISTENCIA - DETECTA
-- =====================================================

-- 1. Categorías principales de conocimiento
CREATE TABLE public.knowledge_base_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  prioridad_default TEXT DEFAULT 'P2',
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Intenciones del usuario (intents)
CREATE TABLE public.knowledge_base_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.knowledge_base_categories(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  disparadores TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  slots_requeridos TEXT[] DEFAULT ARRAY[]::TEXT[],
  prioridad TEXT DEFAULT 'P2',
  sla_minutos INTEGER DEFAULT 60,
  nivel_escalamiento TEXT DEFAULT 'L1',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Playbooks - Guías paso a paso
CREATE TABLE public.knowledge_base_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_id UUID REFERENCES public.knowledge_base_intents(id) ON DELETE CASCADE,
  paso_numero INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'accion',
  titulo TEXT,
  contenido TEXT NOT NULL,
  preguntas TEXT[] DEFAULT ARRAY[]::TEXT[],
  acciones_sistema TEXT[] DEFAULT ARRAY[]::TEXT[],
  condicion_siguiente TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Templates de respuesta
CREATE TABLE public.knowledge_base_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_id UUID REFERENCES public.knowledge_base_intents(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'respuesta',
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Glosario de términos
CREATE TABLE public.knowledge_base_glossary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  termino TEXT NOT NULL UNIQUE,
  definicion TEXT NOT NULL,
  categoria TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Matriz de escalamiento
CREATE TABLE public.knowledge_base_escalation_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nivel TEXT NOT NULL UNIQUE,
  responsable TEXT NOT NULL,
  descripcion TEXT,
  casos_tipicos TEXT[] DEFAULT ARRAY[]::TEXT[],
  sla_sugerido TEXT,
  contacto_escalamiento TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Guardrails de seguridad
CREATE TABLE public.knowledge_base_guardrails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  regla TEXT NOT NULL,
  descripcion TEXT,
  accion_recomendada TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_escalation_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_guardrails ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (el bot necesita leer)
CREATE POLICY "KB categories readable by all" ON public.knowledge_base_categories FOR SELECT USING (true);
CREATE POLICY "KB intents readable by all" ON public.knowledge_base_intents FOR SELECT USING (true);
CREATE POLICY "KB playbooks readable by all" ON public.knowledge_base_playbooks FOR SELECT USING (true);
CREATE POLICY "KB templates readable by all" ON public.knowledge_base_templates FOR SELECT USING (true);
CREATE POLICY "KB glossary readable by all" ON public.knowledge_base_glossary FOR SELECT USING (true);
CREATE POLICY "KB escalation readable by all" ON public.knowledge_base_escalation_matrix FOR SELECT USING (true);
CREATE POLICY "KB guardrails readable by all" ON public.knowledge_base_guardrails FOR SELECT USING (true);

-- Índices para búsqueda eficiente
CREATE INDEX idx_kb_intents_category ON public.knowledge_base_intents(category_id);
CREATE INDEX idx_kb_intents_prioridad ON public.knowledge_base_intents(prioridad);
CREATE INDEX idx_kb_playbooks_intent ON public.knowledge_base_playbooks(intent_id);
CREATE INDEX idx_kb_templates_intent ON public.knowledge_base_templates(intent_id);
CREATE INDEX idx_kb_glossary_termino ON public.knowledge_base_glossary(termino);

-- =====================================================
-- POBLAR CON DATOS DEL DOCUMENTO KB_AI_ASISTENCIA
-- =====================================================

-- CATEGORÍAS
INSERT INTO public.knowledge_base_categories (nombre, descripcion, icono, prioridad_default, orden) VALUES
('Emergencias y Seguridad', 'Situaciones de riesgo, amenazas, accidentes, robos', 'shield-alert', 'P0', 1),
('Pagos y Finanzas', 'Consultas sobre pagos, adelantos, bonos, deducciones', 'wallet', 'P2', 2),
('Gadgets y Equipos', 'GPS, botón de pánico, cargadores, problemas técnicos', 'smartphone', 'P2', 3),
('Servicios y Rutas', 'Asignaciones, cambios de ruta, horarios, cancelaciones', 'route', 'P2', 4),
('Capacitación y Onboarding', 'Módulos de entrenamiento, certificaciones, dudas de proceso', 'graduation-cap', 'P3', 5),
('Soporte General', 'Otras consultas, información general, feedback', 'help-circle', 'P3', 6);

-- GLOSARIO
INSERT INTO public.knowledge_base_glossary (termino, definicion, categoria) VALUES
('C4', 'Centro de Control, Comando, Comunicaciones y Cómputo. Nuestro centro de monitoreo 24/7 que supervisa todos los servicios y responde a emergencias.', 'Operaciones'),
('Gadget', 'Dispositivo GPS portátil asignado al custodio para rastreo de ubicación durante servicios.', 'Equipos'),
('Geocerca', 'Perímetro virtual definido en el mapa que genera alertas cuando el custodio entra o sale de la zona.', 'Monitoreo'),
('Botón de Pánico', 'Dispositivo o función en app que activa alerta inmediata al C4 en situaciones de emergencia.', 'Seguridad'),
('Folio', 'Número único de identificación asignado a cada servicio para seguimiento y facturación.', 'Administrativo'),
('SLA', 'Service Level Agreement. Tiempo máximo comprometido para responder o resolver un ticket según su prioridad.', 'Soporte'),
('Comodato', 'Préstamo de equipos GPS al custodio bajo contrato de responsabilidad.', 'Equipos'),
('Armado', 'Personal de seguridad armado que puede asignarse como apoyo en servicios de alto riesgo.', 'Operaciones');

-- MATRIZ DE ESCALAMIENTO
INSERT INTO public.knowledge_base_escalation_matrix (nivel, responsable, descripcion, casos_tipicos, sla_sugerido, contacto_escalamiento) VALUES
('L1', 'AI Asistente', 'Primera línea de atención automatizada. Resuelve consultas informativas y guía procesos estándar.', 
 ARRAY['Consultas de pago', 'Estado de servicios', 'Información general', 'Dudas de capacitación', 'Problemas menores de app'],
 '< 5 min respuesta inicial', NULL),

('L2', 'Coordinación / Soporte', 'Casos que requieren intervención humana o acceso a sistemas internos.',
 ARRAY['Adelantos de pago', 'Problemas técnicos de GPS', 'Cambios de disponibilidad', 'Emergencias médicas menores', 'Fallas mecánicas'],
 '< 30 min respuesta', 'Slack #soporte-custodios'),

('L3', 'C4 / Monitoreo', 'Situaciones de seguridad que requieren monitoreo activo y posible coordinación con autoridades.',
 ARRAY['Persecución/amenazas', 'Accidentes vehiculares', 'Botón de pánico activado', 'GPS sin señal en zona de riesgo'],
 '< 5 min contacto', 'Radio C4 / WhatsApp Emergencias'),

('L4', 'Dirección / Legal', 'Incidentes críticos con implicaciones legales o de alto impacto.',
 ARRAY['Robo de carga', 'Lesiones graves', 'Secuestro', 'Pérdida total de mercancía'],
 'Inmediato', 'Línea directa Dirección');

-- GUARDRAILS DE SEGURIDAD
INSERT INTO public.knowledge_base_guardrails (tipo, regla, descripcion, accion_recomendada) VALUES
('prohibicion', 'No solicitar contraseñas', 'Nunca pedir al custodio que comparta contraseñas de ningún sistema.', 'Si necesita restablecer acceso, escalar a Sistemas.'),
('prohibicion', 'No dar instrucciones sobre armas', 'No proporcionar instrucciones sobre uso o manejo de armas de fuego.', 'Referir a capacitación presencial de seguridad.'),
('prohibicion', 'No asesoría legal', 'No dar consejos legales sobre accidentes, robos o situaciones con autoridades.', 'Escalar a L4 para contacto con área legal.'),
('obligacion', 'Emergencias reales a 911', 'Si hay riesgo inminente de vida, instruir llamar al 911 además de nuestro C4.', 'Confirmar que custodio tiene forma de contactar 911.'),
('obligacion', 'Proteger datos de carga', 'No revelar detalles específicos de carga, cliente o valores transportados.', 'Referir solo información general necesaria para el servicio.'),
('obligacion', 'Confirmar identidad en pagos', 'Antes de dar información de pagos, confirmar número de teléfono registrado.', 'Validar teléfono antes de revelar montos o estados de pago.'),
('recomendacion', 'Tono empático en emergencias', 'En situaciones de estrés, usar lenguaje calmado y dar instrucciones claras.', 'Priorizar seguridad del custodio sobre procedimientos.'),
('recomendacion', 'Documentar todo', 'Registrar cada interacción con timestamps para auditoría.', 'Guardar mensajes en ticket_respuestas con autor_tipo sistema.');