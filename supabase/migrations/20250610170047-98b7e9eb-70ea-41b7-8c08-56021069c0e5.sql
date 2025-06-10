
-- Crear tabla para tipos de monitoreo disponibles
CREATE TABLE tipos_monitoreo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para modelos y marcas de GPS
CREATE TABLE marcas_gps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE modelos_gps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca_id UUID REFERENCES marcas_gps(id),
  nombre TEXT NOT NULL,
  caracteristicas JSONB,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Actualizar tabla servicios_monitoreo para incluir todos los nuevos campos
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS cantidad_vehiculos INTEGER DEFAULT 1;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS tipo_vehiculo TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS horarios_operacion JSONB;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS rutas_habituales TEXT[];
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS zonas_riesgo_identificadas BOOLEAN DEFAULT false;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS detalles_zonas_riesgo TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS cuenta_gps_instalado BOOLEAN DEFAULT false;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS detalles_gps_actual TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS cuenta_boton_panico BOOLEAN DEFAULT false;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS tipo_gps_preferido TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS marca_gps_preferida TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS modelo_gps_preferido TEXT;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS requiere_paro_motor BOOLEAN DEFAULT false;
ALTER TABLE servicios_monitoreo ADD COLUMN IF NOT EXISTS condiciones_paro_motor TEXT;

-- Crear tabla para configuración de sensores
CREATE TABLE configuracion_sensores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID REFERENCES servicios_monitoreo(id) ON DELETE CASCADE,
  
  -- Sensores de Seguridad y Antimanipulación
  sensor_puerta BOOLEAN DEFAULT false,
  sensor_ignicion BOOLEAN DEFAULT false,
  boton_panico BOOLEAN DEFAULT false,
  corte_ignicion_paro_motor BOOLEAN DEFAULT false,
  deteccion_jamming BOOLEAN DEFAULT false,
  sensor_presencia_vibracion BOOLEAN DEFAULT false,
  
  -- Sensores de Ubicación y Movimiento
  geocercas_dinamicas BOOLEAN DEFAULT false,
  
  -- Sensores de Operación del Vehículo
  lectura_obdii_can_bus BOOLEAN DEFAULT false,
  sensor_combustible BOOLEAN DEFAULT false,
  sensor_temperatura BOOLEAN DEFAULT false,
  sensor_carga_peso BOOLEAN DEFAULT false,
  
  -- Funciones de energía y autonomía
  bateria_interna_respaldo BOOLEAN DEFAULT false,
  alerta_desconexion_electrica BOOLEAN DEFAULT false,
  monitoreo_voltaje BOOLEAN DEFAULT false,
  
  -- Conectividad y Comunicación
  bluetooth_wifi BOOLEAN DEFAULT false,
  compatibilidad_sensores_rs232 BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para contactos de emergencia
CREATE TABLE contactos_emergencia_servicio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID REFERENCES servicios_monitoreo(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  tipo_contacto TEXT NOT NULL, -- 'principal', 'secundario', 'emergencia'
  orden_prioridad INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para configuración de reportes
CREATE TABLE configuracion_reportes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID REFERENCES servicios_monitoreo(id) ON DELETE CASCADE,
  frecuencia_reportes TEXT NOT NULL, -- 'cada_30_minutos', 'diario', 'semanal'
  limitantes_protocolos TEXT,
  medio_contacto_preferido TEXT NOT NULL, -- 'llamada', 'whatsapp', 'sms', 'correo'
  observaciones_adicionales TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar datos iniciales
INSERT INTO tipos_monitoreo (nombre, descripcion) VALUES 
('Persona', 'Monitoreo de protección personal'),
('Flotilla', 'Monitoreo de múltiples vehículos'),
('Carga', 'Monitoreo de transporte de carga'),
('Ruta Crítica', 'Monitoreo de rutas de alto riesgo');

INSERT INTO marcas_gps (nombre) VALUES 
('Teltonika'),
('Queclink'),
('Concox'),
('Meitrack'),
('Aplicom'),
('Calamp');

-- Habilitar RLS en las nuevas tablas
ALTER TABLE tipos_monitoreo ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sensores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos_emergencia_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_reportes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas (permitir lectura a usuarios autenticados)
CREATE POLICY "Allow read tipos_monitoreo" ON tipos_monitoreo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow read marcas_gps" ON marcas_gps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow read modelos_gps" ON modelos_gps FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para tablas relacionadas con servicios (solo el ejecutivo asignado y admins)
CREATE POLICY "Allow all configuracion_sensores" ON configuracion_sensores FOR ALL USING (
  EXISTS (
    SELECT 1 FROM servicios_monitoreo sm 
    WHERE sm.id = configuracion_sensores.servicio_id 
    AND (sm.ejecutivo_ventas_id = auth.uid() OR public.is_admin_bypass_rls())
  )
);

CREATE POLICY "Allow all contactos_emergencia" ON contactos_emergencia_servicio FOR ALL USING (
  EXISTS (
    SELECT 1 FROM servicios_monitoreo sm 
    WHERE sm.id = contactos_emergencia_servicio.servicio_id 
    AND (sm.ejecutivo_ventas_id = auth.uid() OR public.is_admin_bypass_rls())
  )
);

CREATE POLICY "Allow all configuracion_reportes" ON configuracion_reportes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM servicios_monitoreo sm 
    WHERE sm.id = configuracion_reportes.servicio_id 
    AND (sm.ejecutivo_ventas_id = auth.uid() OR public.is_admin_bypass_rls())
  )
);

-- Crear función para obtener servicios con toda la información completa
CREATE OR REPLACE FUNCTION get_servicio_completo_secure(servicio_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar permisos
  IF NOT (
    EXISTS (
      SELECT 1 FROM servicios_monitoreo 
      WHERE id = servicio_uuid 
      AND (ejecutivo_ventas_id = auth.uid() OR public.is_admin_bypass_rls())
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'servicio', row_to_json(sm.*),
    'sensores', row_to_json(cs.*),
    'contactos', (
      SELECT json_agg(row_to_json(ces.*))
      FROM contactos_emergencia_servicio ces 
      WHERE ces.servicio_id = servicio_uuid
    ),
    'reportes', row_to_json(cr.*)
  ) INTO result
  FROM servicios_monitoreo sm
  LEFT JOIN configuracion_sensores cs ON cs.servicio_id = sm.id
  LEFT JOIN configuracion_reportes cr ON cr.servicio_id = sm.id
  WHERE sm.id = servicio_uuid;

  RETURN result;
END;
$$;
