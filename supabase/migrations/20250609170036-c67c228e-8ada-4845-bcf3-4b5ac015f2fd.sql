
-- Tabla para gestión de instaladores
CREATE TABLE instaladores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  telefono text NOT NULL,
  email text NOT NULL,
  cedula_profesional text,
  especialidades text[] DEFAULT '{}', -- GPS, alarmas, camaras, etc
  zona_cobertura jsonb, -- coordenadas de zona de trabajo
  disponibilidad_horaria jsonb, -- horarios disponibles por dia
  calificacion_promedio numeric(3,2) DEFAULT 0.00,
  servicios_completados integer DEFAULT 0,
  estado_afiliacion text DEFAULT 'pendiente' CHECK (estado_afiliacion IN ('pendiente', 'activo', 'suspendido', 'inactivo')),
  fecha_afiliacion timestamp with time zone DEFAULT now(),
  documentacion_completa boolean DEFAULT false,
  certificaciones text[], -- certificaciones obtenidas
  vehiculo_propio boolean DEFAULT false,
  datos_vehiculo jsonb, -- marca, modelo, placas si tiene vehiculo
  banco_datos jsonb, -- datos bancarios para pagos
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para programación de instalaciones GPS
CREATE TABLE programacion_instalaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id uuid NOT NULL REFERENCES servicios_monitoreo(id),
  instalador_id uuid REFERENCES instaladores(id),
  activo_id uuid REFERENCES activos_monitoreo(id),
  tipo_instalacion text NOT NULL CHECK (tipo_instalacion IN ('gps_vehicular', 'gps_personal', 'camara', 'alarma', 'combo')),
  fecha_programada timestamp with time zone NOT NULL,
  fecha_estimada_fin timestamp with time zone,
  direccion_instalacion text NOT NULL,
  coordenadas_instalacion jsonb, -- lat, lng
  contacto_cliente text NOT NULL,
  telefono_contacto text NOT NULL,
  estado text DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'reprogramada')),
  prioridad text DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  equipos_requeridos jsonb, -- lista de equipos necesarios
  herramientas_especiales text[],
  tiempo_estimado integer DEFAULT 120, -- minutos
  observaciones_cliente text,
  instrucciones_especiales text,
  requiere_vehiculo_elevado boolean DEFAULT false,
  acceso_restringido boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para seguimiento de instalaciones
CREATE TABLE seguimiento_instalaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacion_id uuid NOT NULL REFERENCES programacion_instalaciones(id),
  instalador_id uuid NOT NULL REFERENCES instaladores(id),
  fecha_inicio timestamp with time zone,
  fecha_fin timestamp with time zone,
  estado_anterior text,
  estado_nuevo text NOT NULL,
  observaciones text,
  problemas_encontrados text[],
  solucion_aplicada text,
  equipos_utilizados jsonb,
  evidencia_fotografica text[], -- URLs de fotos
  firma_cliente text, -- URL de firma digital
  calificacion_cliente integer CHECK (calificacion_cliente BETWEEN 1 AND 5),
  comentarios_cliente text,
  ubicacion_gps jsonb, -- verificación de ubicación
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla para inventario de equipos GPS
CREATE TABLE inventario_gps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_serie text UNIQUE NOT NULL,
  modelo text NOT NULL,
  marca text NOT NULL,
  tipo_dispositivo text NOT NULL CHECK (tipo_dispositivo IN ('gps_vehicular', 'gps_personal', 'obd', 'camara', 'alarma')),
  estado text DEFAULT 'disponible' CHECK (estado IN ('disponible', 'asignado', 'instalado', 'mantenimiento', 'dañado', 'perdido')),
  instalador_asignado uuid REFERENCES instaladores(id),
  servicio_asignado uuid REFERENCES servicios_monitoreo(id),
  fecha_asignacion timestamp with time zone,
  fecha_instalacion timestamp with time zone,
  ubicacion_actual text,
  firmware_version text,
  ultimo_reporte timestamp with time zone,
  bateria_estado integer, -- porcentaje
  signal_quality integer, -- calidad señal
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para evaluaciones de instaladores
CREATE TABLE evaluaciones_instaladores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacion_id uuid NOT NULL REFERENCES programacion_instalaciones(id),
  instalador_id uuid NOT NULL REFERENCES instaladores(id),
  evaluado_por uuid NOT NULL, -- usuario que evalúa
  calificacion_tecnica integer NOT NULL CHECK (calificacion_tecnica BETWEEN 1 AND 5),
  calificacion_puntualidad integer NOT NULL CHECK (calificacion_puntualidad BETWEEN 1 AND 5),
  calificacion_comunicacion integer NOT NULL CHECK (calificacion_comunicacion BETWEEN 1 AND 5),
  calificacion_general integer NOT NULL CHECK (calificacion_general BETWEEN 1 AND 5),
  comentarios text,
  recomendado boolean DEFAULT true,
  problemas_reportados text[],
  fortalezas_destacadas text[],
  created_at timestamp with time zone DEFAULT now()
);

-- Índices para optimización
CREATE INDEX idx_programacion_instalaciones_fecha ON programacion_instalaciones(fecha_programada);
CREATE INDEX idx_programacion_instalaciones_instalador ON programacion_instalaciones(instalador_id);
CREATE INDEX idx_programacion_instalaciones_estado ON programacion_instalaciones(estado);
CREATE INDEX idx_instaladores_zona ON instaladores USING GIN(zona_cobertura);
CREATE INDEX idx_inventario_gps_estado ON inventario_gps(estado);
CREATE INDEX idx_seguimiento_instalaciones_fecha ON seguimiento_instalaciones(fecha_inicio);

-- Triggers para actualizar timestamps
CREATE TRIGGER update_instaladores_updated_at
  BEFORE UPDATE ON instaladores
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_programacion_instalaciones_updated_at
  BEFORE UPDATE ON programacion_instalaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_inventario_gps_updated_at
  BEFORE UPDATE ON inventario_gps
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Función para calcular calificación promedio del instalador
CREATE OR REPLACE FUNCTION actualizar_calificacion_instalador()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE instaladores 
  SET calificacion_promedio = (
    SELECT AVG(calificacion_general)
    FROM evaluaciones_instaladores 
    WHERE instalador_id = NEW.instalador_id
  ),
  servicios_completados = (
    SELECT COUNT(*)
    FROM programacion_instalaciones 
    WHERE instalador_id = NEW.instalador_id AND estado = 'completada'
  )
  WHERE id = NEW.instalador_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas del instalador
CREATE TRIGGER trigger_actualizar_calificacion_instalador
  AFTER INSERT ON evaluaciones_instaladores
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_calificacion_instalador();

-- RLS Policies (básicas, se pueden refinar)
ALTER TABLE instaladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacion_instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_instaladores ENABLE ROW LEVEL SECURITY;

-- Política básica: los instaladores pueden ver sus propios datos
CREATE POLICY "instaladores_own_data" ON instaladores
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'monitoring_supervisor')
  ));

-- Política para programación: instaladores ven sus asignaciones
CREATE POLICY "instalaciones_access" ON programacion_instalaciones
  FOR ALL TO authenticated
  USING (instalador_id IN (
    SELECT id FROM instaladores WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'monitoring_supervisor')
  ));

-- Función para obtener instaladores disponibles por zona y fecha
CREATE OR REPLACE FUNCTION get_instaladores_disponibles(
  p_fecha timestamp with time zone,
  p_zona jsonb DEFAULT NULL,
  p_tipo_instalacion text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  telefono text,
  calificacion_promedio numeric,
  servicios_completados integer,
  especialidades text[],
  disponible boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.nombre_completo,
    i.telefono,
    i.calificacion_promedio,
    i.servicios_completados,
    i.especialidades,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM programacion_instalaciones pi 
        WHERE pi.instalador_id = i.id 
        AND pi.fecha_programada::date = p_fecha::date
        AND pi.estado NOT IN ('cancelada', 'completada')
      ) THEN false
      ELSE true
    END as disponible
  FROM instaladores i
  WHERE i.estado_afiliacion = 'activo'
    AND i.documentacion_completa = true
    AND (p_tipo_instalacion IS NULL OR p_tipo_instalacion = ANY(i.especialidades))
  ORDER BY i.calificacion_promedio DESC, i.servicios_completados DESC;
END;
$$;
