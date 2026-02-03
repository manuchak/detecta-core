-- =============================================
-- FASE 1: Sistema de Preferencias, Sanciones y Visibilidad Operativa
-- =============================================

-- 1. Agregar preferencia_tipo_servicio a custodios_operativos
ALTER TABLE custodios_operativos 
ADD COLUMN IF NOT EXISTS preferencia_tipo_servicio TEXT DEFAULT 'indistinto' 
CHECK (preferencia_tipo_servicio IN ('local', 'foraneo', 'indistinto'));

COMMENT ON COLUMN custodios_operativos.preferencia_tipo_servicio IS 
'Preferencia del custodio: local (< 100km), foraneo (> 100km), indistinto (cualquiera)';

-- 2. Agregar preferencia_tipo_servicio a armados_operativos
ALTER TABLE armados_operativos 
ADD COLUMN IF NOT EXISTS preferencia_tipo_servicio TEXT DEFAULT 'indistinto' 
CHECK (preferencia_tipo_servicio IN ('local', 'foraneo', 'indistinto'));

COMMENT ON COLUMN armados_operativos.preferencia_tipo_servicio IS 
'Preferencia del armado: local (< 100km), foraneo (> 100km), indistinto (cualquiera)';

-- 3. Agregar campos de inactivacion a custodios_operativos
ALTER TABLE custodios_operativos 
ADD COLUMN IF NOT EXISTS fecha_inactivacion DATE,
ADD COLUMN IF NOT EXISTS motivo_inactivacion TEXT,
ADD COLUMN IF NOT EXISTS tipo_inactivacion TEXT CHECK (tipo_inactivacion IN ('temporal', 'permanente')),
ADD COLUMN IF NOT EXISTS fecha_reactivacion_programada DATE;

-- 4. Agregar campos de inactivacion a armados_operativos
ALTER TABLE armados_operativos 
ADD COLUMN IF NOT EXISTS fecha_inactivacion DATE,
ADD COLUMN IF NOT EXISTS motivo_inactivacion TEXT,
ADD COLUMN IF NOT EXISTS tipo_inactivacion TEXT CHECK (tipo_inactivacion IN ('temporal', 'permanente')),
ADD COLUMN IF NOT EXISTS fecha_reactivacion_programada DATE;

-- 5. Agregar campos de métricas 15 días a custodios_operativos
ALTER TABLE custodios_operativos
ADD COLUMN IF NOT EXISTS servicios_locales_15d INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS servicios_foraneos_15d INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_calculo_15d TIMESTAMPTZ;

-- 6. Agregar campos de métricas 15 días a armados_operativos
ALTER TABLE armados_operativos
ADD COLUMN IF NOT EXISTS servicios_locales_15d INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS servicios_foraneos_15d INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_calculo_15d TIMESTAMPTZ;

-- 7. Crear tabla de historial de estatus
CREATE TABLE IF NOT EXISTS operativo_estatus_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_id UUID NOT NULL,
  operativo_tipo TEXT NOT NULL CHECK (operativo_tipo IN ('custodio', 'armado')),
  estatus_anterior TEXT NOT NULL,
  estatus_nuevo TEXT NOT NULL,
  tipo_cambio TEXT NOT NULL CHECK (tipo_cambio IN ('temporal', 'permanente', 'reactivacion')),
  motivo TEXT NOT NULL,
  fecha_reactivacion DATE,
  notas TEXT,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operativo_estatus_operativo ON operativo_estatus_historial(operativo_id);
CREATE INDEX IF NOT EXISTS idx_operativo_estatus_fecha ON operativo_estatus_historial(created_at DESC);

-- Enable RLS
ALTER TABLE operativo_estatus_historial ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Usuarios autenticados pueden ver historial de estatus"
ON operativo_estatus_historial FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar historial de estatus"
ON operativo_estatus_historial FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. Crear tabla de catálogo de sanciones
CREATE TABLE IF NOT EXISTS catalogo_sanciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('leve', 'moderada', 'grave', 'muy_grave')),
  dias_suspension_default INTEGER NOT NULL,
  afecta_score BOOLEAN DEFAULT true,
  puntos_score_perdidos INTEGER DEFAULT 0,
  requiere_evidencia BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE catalogo_sanciones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Usuarios autenticados pueden ver catálogo de sanciones"
ON catalogo_sanciones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar catálogo de sanciones"
ON catalogo_sanciones FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Insertar catálogo inicial de sanciones
INSERT INTO catalogo_sanciones (codigo, nombre, categoria, dias_suspension_default, puntos_score_perdidos, descripcion) VALUES
('ABANDONO_SERVICIO', 'Abandono de servicio', 'muy_grave', 30, 25, 'Dejar el servicio sin autorización'),
('CANCELACION_ULTIMA_HORA', 'Cancelación a última hora', 'grave', 14, 15, 'Cancelar servicio con menos de 2 horas de anticipación'),
('NO_SHOW', 'No presentarse', 'muy_grave', 21, 20, 'No presentarse al servicio sin avisar'),
('LLEGADA_TARDE', 'Llegada tarde recurrente', 'moderada', 7, 10, 'Llegar tarde a 3+ servicios en 30 días'),
('INCUMPLIMIENTO_PROTOCOLO', 'Incumplimiento de protocolo', 'grave', 14, 15, 'No seguir protocolos de seguridad'),
('QUEJA_CLIENTE', 'Queja formal de cliente', 'moderada', 7, 10, 'Queja verificada por parte del cliente'),
('DOCUMENTACION_VENCIDA', 'Documentación vencida', 'leve', 0, 5, 'Operar con documentos vencidos')
ON CONFLICT (codigo) DO NOTHING;

-- 10. Crear tabla de sanciones aplicadas
CREATE TABLE IF NOT EXISTS sanciones_aplicadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_id UUID NOT NULL,
  operativo_tipo TEXT NOT NULL CHECK (operativo_tipo IN ('custodio', 'armado')),
  sancion_id UUID REFERENCES catalogo_sanciones(id),
  servicio_relacionado_id UUID,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_suspension INTEGER NOT NULL,
  puntos_perdidos INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'cumplida', 'apelada', 'revocada')),
  evidencia_urls TEXT[],
  notas TEXT,
  aplicada_por UUID REFERENCES auth.users(id),
  revisada_por UUID REFERENCES auth.users(id),
  fecha_revision TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sanciones_operativo ON sanciones_aplicadas(operativo_id, estado);
CREATE INDEX IF NOT EXISTS idx_sanciones_fechas ON sanciones_aplicadas(fecha_inicio, fecha_fin);

-- Enable RLS
ALTER TABLE sanciones_aplicadas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Usuarios autenticados pueden ver sanciones aplicadas"
ON sanciones_aplicadas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar sanciones aplicadas"
ON sanciones_aplicadas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);