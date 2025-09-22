-- Create tables for armed guards management

-- Table for internal armed guards (employees)
CREATE TABLE public.armados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  zona_base TEXT,
  disponibilidad TEXT NOT NULL DEFAULT 'disponible',
  estado TEXT NOT NULL DEFAULT 'activo',
  licencia_portacion TEXT,
  fecha_vencimiento_licencia DATE,
  experiencia_anos INTEGER DEFAULT 0,
  rating_promedio NUMERIC DEFAULT 0,
  numero_servicios INTEGER DEFAULT 0,
  tasa_respuesta NUMERIC DEFAULT 0,
  tasa_confirmacion NUMERIC DEFAULT 0,
  equipamiento_disponible TEXT[],
  observaciones TEXT,
  fecha_ultimo_servicio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for external armed guard providers
CREATE TABLE public.proveedores_armados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_empresa TEXT NOT NULL,
  contacto_principal TEXT NOT NULL,
  telefono_contacto TEXT NOT NULL,
  email_contacto TEXT,
  zonas_cobertura TEXT[],
  tarifa_por_servicio NUMERIC,
  disponibilidad_24h BOOLEAN DEFAULT false,
  tiempo_respuesta_promedio INTEGER, -- en minutos
  rating_proveedor NUMERIC DEFAULT 0,
  servicios_completados INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  documentacion_legal TEXT[], -- licencias, seguros, etc.
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for armed guard assignments to services
CREATE TABLE public.asignacion_armados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_custodia_id TEXT, -- reference to servicios_custodia.id_servicio
  custodio_id UUID, -- reference to custodios_operativos or pc_custodios
  armado_id UUID, -- reference to armados.id
  proveedor_armado_id UUID, -- reference to proveedores_armados.id
  tipo_asignacion TEXT NOT NULL DEFAULT 'interno', -- 'interno' or 'proveedor'
  punto_encuentro TEXT,
  coordenadas_encuentro POINT,
  hora_encuentro TIMESTAMP WITH TIME ZONE,
  estado_asignacion TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'
  confirmado_por_armado BOOLEAN DEFAULT false,
  confirmado_por_custodio BOOLEAN DEFAULT false,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  asignado_por UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.armados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores_armados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignacion_armados ENABLE ROW LEVEL SECURITY;

-- RLS Policies for armados
CREATE POLICY "Authorized users can view armados" ON public.armados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "Authorized users can manage armados" ON public.armados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- RLS Policies for proveedores_armados
CREATE POLICY "Authorized users can view providers" ON public.proveedores_armados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "Authorized users can manage providers" ON public.proveedores_armados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- RLS Policies for asignacion_armados
CREATE POLICY "Authorized users can view assignments" ON public.asignacion_armados
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin')
    )
  );

CREATE POLICY "Authorized users can manage assignments" ON public.asignacion_armados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
    )
  );

-- Add indexes for performance
CREATE INDEX idx_armados_zona_base ON public.armados(zona_base);
CREATE INDEX idx_armados_disponibilidad ON public.armados(disponibilidad);
CREATE INDEX idx_proveedores_armados_zonas ON public.proveedores_armados USING GIN(zonas_cobertura);
CREATE INDEX idx_asignacion_armados_servicio ON public.asignacion_armados(servicio_custodia_id);
CREATE INDEX idx_asignacion_armados_estado ON public.asignacion_armados(estado_asignacion);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_armados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_armados_updated_at
  BEFORE UPDATE ON public.armados
  FOR EACH ROW
  EXECUTE FUNCTION update_armados_updated_at();

CREATE TRIGGER update_proveedores_armados_updated_at
  BEFORE UPDATE ON public.proveedores_armados
  FOR EACH ROW
  EXECUTE FUNCTION update_armados_updated_at();

CREATE TRIGGER update_asignacion_armados_updated_at
  BEFORE UPDATE ON public.asignacion_armados
  FOR EACH ROW
  EXECUTE FUNCTION update_armados_updated_at();