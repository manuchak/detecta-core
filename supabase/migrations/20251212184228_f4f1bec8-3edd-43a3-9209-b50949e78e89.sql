
-- =====================================================
-- CENTRO DE ATENCIÓN AL AFILIADO - INFRAESTRUCTURA
-- =====================================================

-- 1. Tabla de categorías de tickets para custodios
CREATE TABLE public.ticket_categorias_custodio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50) DEFAULT 'HelpCircle',
  color VARCHAR(20) DEFAULT 'blue',
  departamento_responsable VARCHAR(50) NOT NULL DEFAULT 'soporte',
  sla_horas_respuesta INTEGER DEFAULT 24,
  sla_horas_resolucion INTEGER DEFAULT 72,
  requiere_monto BOOLEAN DEFAULT false,
  requiere_servicio BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabla de subcategorías
CREATE TABLE public.ticket_subcategorias_custodio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES public.ticket_categorias_custodio(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  plantilla_respuesta TEXT,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabla de respuestas/comentarios de tickets
CREATE TABLE public.ticket_respuestas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL,
  autor_tipo VARCHAR(20) NOT NULL CHECK (autor_tipo IN ('custodio', 'agente', 'sistema')),
  autor_nombre VARCHAR(150),
  mensaje TEXT NOT NULL,
  adjuntos_urls TEXT[],
  es_resolucion BOOLEAN DEFAULT false,
  es_interno BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Modificar tabla tickets con nuevas columnas
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS custodio_id UUID,
ADD COLUMN IF NOT EXISTS custodio_telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS servicio_id TEXT,
ADD COLUMN IF NOT EXISTS categoria_custodio_id UUID REFERENCES public.ticket_categorias_custodio(id),
ADD COLUMN IF NOT EXISTS subcategoria_custodio_id UUID REFERENCES public.ticket_subcategorias_custodio(id),
ADD COLUMN IF NOT EXISTS tipo_ticket VARCHAR(20) DEFAULT 'general' CHECK (tipo_ticket IN ('general', 'custodio', 'cliente')),
ADD COLUMN IF NOT EXISTS monto_reclamado DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS evidencia_urls TEXT[],
ADD COLUMN IF NOT EXISTS fecha_sla_respuesta TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fecha_sla_resolucion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS primera_respuesta_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resuelto_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resuelto_por UUID,
ADD COLUMN IF NOT EXISTS calificacion_csat INTEGER CHECK (calificacion_csat >= 1 AND calificacion_csat <= 5),
ADD COLUMN IF NOT EXISTS comentario_csat TEXT;

-- 5. Insertar categorías predefinidas
INSERT INTO public.ticket_categorias_custodio (nombre, descripcion, icono, color, departamento_responsable, sla_horas_respuesta, sla_horas_resolucion, requiere_monto, requiere_servicio, orden) VALUES
('Pagos y Comisiones', 'Problemas relacionados con pagos, comisiones y liquidaciones', 'DollarSign', 'green', 'finanzas', 24, 48, true, false, 1),
('Gastos y Reembolsos', 'Solicitudes de reembolso por gastos extras durante servicios', 'Receipt', 'amber', 'finanzas', 24, 72, true, true, 2),
('Servicios y Asignaciones', 'Problemas con asignaciones, rutas o servicios realizados', 'Truck', 'blue', 'planeacion', 12, 48, false, true, 3),
('Equipamiento GPS', 'Fallas, reparaciones o problemas con dispositivos GPS', 'MapPin', 'purple', 'instaladores', 24, 72, false, false, 4),
('Cuenta y Perfil', 'Actualización de datos personales, documentos o accesos', 'User', 'slate', 'supply', 24, 48, false, false, 5),
('Soporte General', 'Otras consultas y solicitudes de apoyo', 'HelpCircle', 'gray', 'soporte', 24, 72, false, false, 6);

-- 6. Insertar subcategorías
INSERT INTO public.ticket_subcategorias_custodio (categoria_id, nombre, descripcion, plantilla_respuesta, orden)
SELECT c.id, s.nombre, s.descripcion, s.plantilla, s.orden
FROM public.ticket_categorias_custodio c
CROSS JOIN (
  VALUES 
    -- Pagos y Comisiones
    ('Pagos y Comisiones', 'Pago no recibido', 'No he recibido el pago correspondiente', 'Estimado custodio, hemos verificado su caso y el pago será procesado en las próximas 24-48 horas.', 1),
    ('Pagos y Comisiones', 'Monto incorrecto', 'El monto pagado no coincide con lo esperado', 'Hemos revisado su liquidación y procederemos a realizar el ajuste correspondiente.', 2),
    ('Pagos y Comisiones', 'Error en liquidación', 'Hay errores en el cálculo de mi liquidación', 'Revisaremos su liquidación y le enviaremos el detalle corregido.', 3),
    ('Pagos y Comisiones', 'Bonificación no aplicada', 'No se aplicó una bonificación acordada', 'Verificaremos los términos de la bonificación y aplicaremos el ajuste.', 4),
    -- Gastos y Reembolsos
    ('Gastos y Reembolsos', 'Gasolina extra', 'Gasté más gasolina de lo contemplado', 'Por favor adjunte el ticket de gasolina para procesar su reembolso.', 1),
    ('Gastos y Reembolsos', 'Casetas no contempladas', 'Tuve que pagar casetas no incluidas', 'Adjunte los comprobantes de casetas para su reembolso.', 2),
    ('Gastos y Reembolsos', 'Viáticos', 'Solicitud de viáticos por servicio foráneo', 'Revisaremos los viáticos correspondientes a su servicio.', 3),
    ('Gastos y Reembolsos', 'Reparación vehículo', 'Daño al vehículo durante servicio', 'Necesitamos fotos del daño y cotización de reparación.', 4),
    -- Servicios y Asignaciones
    ('Servicios y Asignaciones', 'Servicio no asignado correctamente', 'Error en la asignación del servicio', 'Verificaremos la asignación y realizaremos los ajustes necesarios.', 1),
    ('Servicios y Asignaciones', 'Tiempo de espera excesivo', 'Tuve que esperar más de lo acordado', 'Revisaremos el registro del servicio para compensar el tiempo extra.', 2),
    ('Servicios y Asignaciones', 'Ruta incorrecta', 'La ruta asignada no era correcta', 'Analizaremos la ruta y ajustaremos si corresponde compensación.', 3),
    ('Servicios y Asignaciones', 'Cliente conflictivo', 'Tuve problemas con el cliente', 'Registraremos el incidente y tomaremos las medidas correspondientes.', 4),
    -- Equipamiento GPS
    ('Equipamiento GPS', 'GPS no funciona', 'El dispositivo GPS no enciende o no transmite', 'Programaremos una visita técnica para revisar su dispositivo.', 1),
    ('Equipamiento GPS', 'Batería agotada', 'La batería del GPS se agota muy rápido', 'Evaluaremos el estado de la batería para su reemplazo.', 2),
    ('Equipamiento GPS', 'Solicitud de instalación', 'Requiero instalación de GPS', 'Coordinaremos la cita de instalación con nuestro equipo técnico.', 3),
    ('Equipamiento GPS', 'Retiro de equipo', 'Solicito retiro del equipo GPS', 'Programaremos el retiro del equipo según disponibilidad.', 4),
    -- Cuenta y Perfil
    ('Cuenta y Perfil', 'Actualizar datos personales', 'Cambio de dirección, teléfono u otros datos', 'Proporcione los datos actualizados para realizar el cambio.', 1),
    ('Cuenta y Perfil', 'Renovar documentos', 'Vencimiento de licencia, INE u otros documentos', 'Por favor suba los documentos actualizados.', 2),
    ('Cuenta y Perfil', 'Problemas de acceso', 'No puedo acceder a mi cuenta', 'Verificaremos su acceso y restableceremos si es necesario.', 3),
    ('Cuenta y Perfil', 'Cambio de vehículo', 'Cambié de vehículo de trabajo', 'Proporcione los datos del nuevo vehículo para actualizar su perfil.', 4),
    -- Soporte General
    ('Soporte General', 'Consulta general', 'Tengo una pregunta general', 'Gracias por su consulta, le responderemos a la brevedad.', 1),
    ('Soporte General', 'Sugerencia', 'Tengo una sugerencia de mejora', 'Agradecemos su sugerencia, la tomaremos en cuenta.', 2),
    ('Soporte General', 'Felicitación', 'Quiero felicitar al equipo', '¡Gracias por sus palabras! Las compartiremos con el equipo.', 3),
    ('Soporte General', 'Otro', 'Otro tipo de solicitud', 'Hemos recibido su solicitud y la atenderemos pronto.', 4)
) AS s(categoria, nombre, descripcion, plantilla, orden)
WHERE c.nombre = s.categoria;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_custodio_id ON public.tickets(custodio_id);
CREATE INDEX IF NOT EXISTS idx_tickets_custodio_telefono ON public.tickets(custodio_telefono);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo_ticket ON public.tickets(tipo_ticket);
CREATE INDEX IF NOT EXISTS idx_tickets_categoria_custodio ON public.tickets(categoria_custodio_id);
CREATE INDEX IF NOT EXISTS idx_ticket_respuestas_ticket_id ON public.ticket_respuestas(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_subcategorias_categoria ON public.ticket_subcategorias_custodio(categoria_id);

-- 8. Función para calcular SLA automáticamente
CREATE OR REPLACE FUNCTION public.set_ticket_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.categoria_custodio_id IS NOT NULL AND NEW.fecha_sla_respuesta IS NULL THEN
    SELECT 
      NEW.created_at + (sla_horas_respuesta || ' hours')::interval,
      NEW.created_at + (sla_horas_resolucion || ' hours')::interval
    INTO NEW.fecha_sla_respuesta, NEW.fecha_sla_resolucion
    FROM public.ticket_categorias_custodio
    WHERE id = NEW.categoria_custodio_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Trigger para SLA
DROP TRIGGER IF EXISTS trigger_set_ticket_sla ON public.tickets;
CREATE TRIGGER trigger_set_ticket_sla
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_sla();

-- 10. Función para actualizar primera respuesta
CREATE OR REPLACE FUNCTION public.update_ticket_first_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.autor_tipo = 'agente' AND NOT NEW.es_interno THEN
    UPDATE public.tickets
    SET primera_respuesta_at = COALESCE(primera_respuesta_at, NEW.created_at)
    WHERE id = NEW.ticket_id AND primera_respuesta_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 11. Trigger para primera respuesta
DROP TRIGGER IF EXISTS trigger_update_first_response ON public.ticket_respuestas;
CREATE TRIGGER trigger_update_first_response
  AFTER INSERT ON public.ticket_respuestas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_first_response();

-- 12. Storage bucket para evidencias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-evidencias', 
  'ticket-evidencias', 
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 13. RLS para ticket_categorias_custodio
ALTER TABLE public.ticket_categorias_custodio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorías visibles para autenticados"
ON public.ticket_categorias_custodio FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins modifican categorías"
ON public.ticket_categorias_custodio FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

-- 14. RLS para ticket_subcategorias_custodio
ALTER TABLE public.ticket_subcategorias_custodio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subcategorías visibles para autenticados"
ON public.ticket_subcategorias_custodio FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins modifican subcategorías"
ON public.ticket_subcategorias_custodio FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

-- 15. RLS para ticket_respuestas
ALTER TABLE public.ticket_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven respuestas de sus tickets"
ON public.ticket_respuestas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (
      t.custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
      OR t.assigned_to = auth.uid()
      OR t.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'soporte', 'coordinador_operaciones')
      )
    )
  )
);

CREATE POLICY "Usuarios pueden crear respuestas"
ON public.ticket_respuestas FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 16. Storage policies para ticket-evidencias
CREATE POLICY "Usuarios suben evidencias"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-evidencias' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Usuarios ven sus evidencias"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-evidencias'
  AND auth.uid() IS NOT NULL
);
