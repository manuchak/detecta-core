
-- Tabla para documentación de instalaciones
CREATE TABLE instalacion_documentacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID REFERENCES programacion_instalaciones(id) ON DELETE CASCADE,
  paso_instalacion TEXT NOT NULL CHECK (paso_instalacion IN (
    'inspeccion_inicial',
    'dispositivo_gps', 
    'ubicacion_instalacion',
    'proceso_instalacion',
    'cableado_conexiones',
    'dispositivo_funcionando',
    'validacion_final'
  )),
  foto_url TEXT,
  descripcion TEXT,
  orden INTEGER NOT NULL,
  completado BOOLEAN DEFAULT FALSE,
  coordenadas_latitud DECIMAL(10,8),
  coordenadas_longitud DECIMAL(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla para validaciones manuales del proceso
CREATE TABLE instalacion_validaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID REFERENCES programacion_instalaciones(id) ON DELETE CASCADE,
  tipo_validacion TEXT NOT NULL CHECK (tipo_validacion IN (
    'senal_gps_manual',
    'conectividad_manual', 
    'funcionamiento_dispositivo',
    'calidad_instalacion',
    'satisfaccion_cliente'
  )),
  validado BOOLEAN NOT NULL DEFAULT FALSE,
  comentarios TEXT,
  puntuacion INTEGER CHECK (puntuacion >= 1 AND puntuacion <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla para comentarios finales y observaciones
CREATE TABLE instalacion_reporte_final (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID REFERENCES programacion_instalaciones(id) ON DELETE CASCADE,
  comentarios_instalador TEXT,
  comentarios_cliente TEXT,
  tiempo_total_minutos INTEGER,
  dificultades_encontradas TEXT[],
  materiales_adicionales_usados TEXT[],
  recomendaciones TEXT,
  calificacion_servicio INTEGER CHECK (calificacion_servicio >= 1 AND calificacion_servicio <= 5),
  firma_cliente_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Añadir índices para mejor performance
CREATE INDEX idx_instalacion_documentacion_programacion ON instalacion_documentacion(programacion_id);
CREATE INDEX idx_instalacion_validaciones_programacion ON instalacion_validaciones(programacion_id);
CREATE INDEX idx_instalacion_reporte_programacion ON instalacion_reporte_final(programacion_id);

-- Storage bucket para fotos de instalación (ejecutar desde el dashboard de Supabase)
INSERT INTO storage.buckets (id, name, public) VALUES ('instalacion-fotos', 'instalacion-fotos', true);

-- Políticas RLS para instalacion_documentacion
ALTER TABLE instalacion_documentacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instaladores pueden ver documentación de sus instalaciones" ON instalacion_documentacion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM programacion_instalaciones pi 
      WHERE pi.id = programacion_id 
      AND pi.instalador_id::uuid = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'coordinador_operaciones')
    )
  );

CREATE POLICY "Instaladores pueden crear documentación de sus instalaciones" ON instalacion_documentacion
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM programacion_instalaciones pi 
      WHERE pi.id = programacion_id 
      AND pi.instalador_id::uuid = auth.uid()
    )
  );

-- Políticas RLS para instalacion_validaciones
ALTER TABLE instalacion_validaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instaladores pueden gestionar validaciones de sus instalaciones" ON instalacion_validaciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programacion_instalaciones pi 
      WHERE pi.id = programacion_id 
      AND pi.instalador_id::uuid = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'coordinador_operaciones')
    )
  );

-- Políticas RLS para instalacion_reporte_final
ALTER TABLE instalacion_reporte_final ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instaladores pueden gestionar reportes de sus instalaciones" ON instalacion_reporte_final
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programacion_instalaciones pi 
      WHERE pi.id = programacion_id 
      AND pi.instalador_id::uuid = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'coordinador_operaciones')
    )
  );
