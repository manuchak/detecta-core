
-- Agregar rol de instalador sin insertar un usuario placeholder
INSERT INTO role_permissions (role, permission_type, permission_id, allowed)
VALUES 
  ('instalador', 'page', 'dashboard', true),
  ('instalador', 'page', 'instalaciones', true),
  ('instalador', 'page', 'profile', true),
  ('instalador', 'action', 'upload_evidence', true),
  ('instalador', 'action', 'update_installation_status', true)
ON CONFLICT DO NOTHING;

-- Crear tabla programacion_instalaciones
CREATE TABLE IF NOT EXISTS programacion_instalaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL,
  instalador_id UUID,
  activo_id UUID,
  tipo_instalacion TEXT NOT NULL,
  fecha_programada TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_estimada_fin TIMESTAMP WITH TIME ZONE,
  direccion_instalacion TEXT NOT NULL,
  coordenadas_instalacion JSONB,
  contacto_cliente TEXT NOT NULL,
  telefono_contacto TEXT NOT NULL,
  equipos_requeridos JSONB,
  tiempo_estimado INTEGER DEFAULT 120,
  precio_instalacion DECIMAL(10,2),
  instrucciones_especiales TEXT,
  estado TEXT DEFAULT 'programada',
  requiere_vehiculo_elevado BOOLEAN DEFAULT false,
  acceso_restringido BOOLEAN DEFAULT false,
  herramientas_especiales TEXT[],
  observaciones_cliente TEXT,
  prioridad TEXT DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla seguimiento_instalaciones
CREATE TABLE IF NOT EXISTS seguimiento_instalaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacion_id UUID NOT NULL,
  instalador_id UUID NOT NULL,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  estado_anterior TEXT,
  estado_nuevo TEXT NOT NULL,
  equipos_utilizados JSONB,
  problemas_encontrados TEXT[],
  solucion_aplicada TEXT,
  evidencia_fotografica TEXT[],
  firma_cliente TEXT,
  comentarios_cliente TEXT,
  calificacion_cliente INTEGER CHECK (calificacion_cliente BETWEEN 1 AND 5),
  ubicacion_gps JSONB,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla evaluaciones_instaladores
CREATE TABLE IF NOT EXISTS evaluaciones_instaladores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacion_id UUID NOT NULL,
  instalador_id UUID NOT NULL,
  evaluado_por UUID NOT NULL,
  calificacion_tecnica INTEGER NOT NULL CHECK (calificacion_tecnica BETWEEN 1 AND 5),
  calificacion_puntualidad INTEGER NOT NULL CHECK (calificacion_puntualidad BETWEEN 1 AND 5),
  calificacion_comunicacion INTEGER NOT NULL CHECK (calificacion_comunicacion BETWEEN 1 AND 5),
  calificacion_general INTEGER NOT NULL CHECK (calificacion_general BETWEEN 1 AND 5),
  comentarios TEXT,
  problemas_reportados TEXT[],
  fortalezas_destacadas TEXT[],
  recomendado BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla inventario_gps
CREATE TABLE IF NOT EXISTS inventario_gps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_serie TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  tipo_dispositivo TEXT NOT NULL,
  estado TEXT DEFAULT 'disponible',
  instalador_asignado UUID,
  servicio_asignado UUID,
  fecha_asignacion TIMESTAMP WITH TIME ZONE,
  fecha_instalacion TIMESTAMP WITH TIME ZONE,
  ubicacion_actual TEXT,
  firmware_version TEXT,
  ultimo_reporte TIMESTAMP WITH TIME ZONE,
  bateria_estado INTEGER,
  signal_quality INTEGER,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Función para validar horarios de instalación
CREATE OR REPLACE FUNCTION validar_horario_instalacion(fecha_programada TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  dia_semana INTEGER;
  horas_diferencia NUMERIC;
BEGIN
  dia_semana := EXTRACT(DOW FROM fecha_programada);
  IF dia_semana = 0 OR dia_semana = 6 THEN
    RETURN FALSE;
  END IF;
  
  horas_diferencia := EXTRACT(EPOCH FROM (fecha_programada - now())) / 3600;
  IF horas_diferencia < 72 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Trigger para validar fechas de instalación
CREATE OR REPLACE FUNCTION trigger_validar_fecha_instalacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT validar_horario_instalacion(NEW.fecha_programada) THEN
    RAISE EXCEPTION 'La instalación debe programarse en día laborable con al menos 72 horas de anticipación';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS validar_fecha_instalacion_trigger ON programacion_instalaciones;
CREATE TRIGGER validar_fecha_instalacion_trigger
  BEFORE INSERT OR UPDATE OF fecha_programada ON programacion_instalaciones
  FOR EACH ROW EXECUTE FUNCTION trigger_validar_fecha_instalacion();

-- Actualizar constraint de servicios_monitoreo
ALTER TABLE servicios_monitoreo DROP CONSTRAINT IF EXISTS servicios_monitoreo_estado_general_check;
ALTER TABLE servicios_monitoreo 
ADD CONSTRAINT servicios_monitoreo_estado_general_check 
CHECK (estado_general IN (
    'pendiente_evaluacion',
    'pendiente_analisis_riesgo', 
    'rechazado_coordinador',
    'requiere_aclaracion_cliente',
    'aprobado',
    'rechazado_seguridad',
    'programacion_instalacion',
    'instalacion_programada',
    'instalacion_completada',
    'activo',
    'suspendido',
    'cancelado'
));

-- Habilitar RLS
ALTER TABLE programacion_instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_instaladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_gps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Ver instalaciones asignadas" ON programacion_instalaciones
  FOR SELECT USING (
    instalador_id IN (
      SELECT id FROM instaladores WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring')
    )
  );

CREATE POLICY "Crear instalaciones - solo supervisores" ON programacion_instalaciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring')
    )
  );

CREATE POLICY "Ver seguimiento de instalaciones" ON seguimiento_instalaciones
  FOR SELECT USING (
    instalador_id IN (
      SELECT id FROM instaladores WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring')
    )
  );

CREATE POLICY "Instaladores pueden crear seguimiento" ON seguimiento_instalaciones
  FOR INSERT WITH CHECK (
    instalador_id IN (
      SELECT id FROM instaladores WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'monitoring_supervisor', 'monitoring')
    )
  );
