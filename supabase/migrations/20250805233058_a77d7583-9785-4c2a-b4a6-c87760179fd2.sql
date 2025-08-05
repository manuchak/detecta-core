-- Crear tabla de empresas instaladoras
CREATE TABLE public.empresas_instaladoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  rfc TEXT NOT NULL UNIQUE,
  telefono_principal TEXT NOT NULL,
  email_principal TEXT NOT NULL,
  direccion_fiscal TEXT,
  cobertura_geografica TEXT[] DEFAULT '{}',
  especialidades TEXT[] DEFAULT '{}',
  estado_contrato TEXT NOT NULL DEFAULT 'activo' CHECK (estado_contrato IN ('activo', 'inactivo', 'suspendido')),
  tarifas_negociadas JSONB DEFAULT '{}',
  documentacion_completa BOOLEAN DEFAULT false,
  certificaciones TEXT[] DEFAULT '{}',
  años_experiencia INTEGER,
  capacidad_instaladores INTEGER,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de contactos de empresa
CREATE TABLE public.contactos_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas_instaladoras(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  cargo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  rol_contacto TEXT NOT NULL DEFAULT 'comercial' CHECK (rol_contacto IN ('comercial', 'tecnico', 'administrativo', 'coordinador')),
  es_contacto_principal BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  permisos_acceso TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modificar tabla instaladores para agregar campos de empresa
ALTER TABLE public.instaladores 
ADD COLUMN empresa_id UUID REFERENCES public.empresas_instaladoras(id) ON DELETE SET NULL,
ADD COLUMN tipo_instalador TEXT NOT NULL DEFAULT 'individual' CHECK (tipo_instalador IN ('individual', 'empresa')),
ADD COLUMN activo_empresa BOOLEAN DEFAULT true,
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índices para mejor performance
CREATE INDEX idx_empresas_instaladoras_estado ON public.empresas_instaladoras(estado_contrato);
CREATE INDEX idx_empresas_instaladoras_cobertura ON public.empresas_instaladoras USING GIN(cobertura_geografica);
CREATE INDEX idx_contactos_empresa_empresa_id ON public.contactos_empresa(empresa_id);
CREATE INDEX idx_contactos_empresa_principal ON public.contactos_empresa(empresa_id, es_contacto_principal) WHERE es_contacto_principal = true;
CREATE INDEX idx_instaladores_empresa ON public.instaladores(empresa_id) WHERE empresa_id IS NOT NULL;
CREATE INDEX idx_instaladores_tipo ON public.instaladores(tipo_instalador);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_empresas_instaladoras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_contactos_empresa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar timestamps
CREATE TRIGGER update_empresas_instaladoras_updated_at
  BEFORE UPDATE ON public.empresas_instaladoras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_empresas_instaladoras_updated_at();

CREATE TRIGGER update_contactos_empresa_updated_at
  BEFORE UPDATE ON public.contactos_empresa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contactos_empresa_updated_at();

-- Habilitar RLS
ALTER TABLE public.empresas_instaladoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas instaladoras
CREATE POLICY "Empresas instaladoras visibles para usuarios autenticados"
  ON public.empresas_instaladoras
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden gestionar empresas instaladoras"
  ON public.empresas_instaladoras
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- Políticas RLS para contactos de empresa
CREATE POLICY "Contactos de empresa visibles para usuarios autenticados"
  ON public.contactos_empresa
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admins pueden gestionar contactos de empresa"
  ON public.contactos_empresa
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'coordinador_operaciones')
    )
  );

-- Insertar algunos datos de ejemplo para empresas
INSERT INTO public.empresas_instaladoras (
  razon_social,
  nombre_comercial,
  rfc,
  telefono_principal,
  email_principal,
  cobertura_geografica,
  especialidades,
  tarifas_negociadas,
  años_experiencia,
  capacidad_instaladores
) VALUES 
(
  'Instalaciones Técnicas del Centro SA de CV',
  'TecnoGPS Centro',
  'ITC890523ABC',
  '5555123456',
  'contacto@tecnogpscentro.com',
  ARRAY['CDMX', 'Estado de México', 'Puebla', 'Tlaxcala'],
  ARRAY['GPS Vehicular', 'GPS Personal', 'Cámaras', 'Alarmas'],
  '{"instalacion_basica": 800, "gps_avanzado": 1200, "descuento_volumen": 15}',
  8,
  25
),
(
  'Seguridad Integral del Norte SA de CV',
  'SecuriNorte',
  'SIN740912XYZ',
  '8181567890',
  'ventas@securinorte.com',
  ARRAY['Nuevo León', 'Coahuila', 'Tamaulipas'],
  ARRAY['GPS Vehicular', 'Sistemas de Rastreo', 'Botones de Pánico'],
  '{"instalacion_basica": 750, "gps_avanzado": 1100, "descuento_volumen": 20}',
  12,
  40
);

-- Insertar contactos para las empresas de ejemplo
INSERT INTO public.contactos_empresa (
  empresa_id,
  nombre_completo,
  cargo,
  telefono,
  email,
  rol_contacto,
  es_contacto_principal
) VALUES 
(
  (SELECT id FROM public.empresas_instaladoras WHERE rfc = 'ITC890523ABC'),
  'Carlos Mendoza Rivera',
  'Director Comercial',
  '5555123456',
  'carlos.mendoza@tecnogpscentro.com',
  'comercial',
  true
),
(
  (SELECT id FROM public.empresas_instaladoras WHERE rfc = 'ITC890523ABC'),
  'Ana López Torres',
  'Coordinadora Técnica',
  '5555123457',
  'ana.lopez@tecnogpscentro.com',
  'tecnico',
  false
),
(
  (SELECT id FROM public.empresas_instaladoras WHERE rfc = 'SIN740912XYZ'),
  'Miguel Santos Hernández',
  'Gerente de Operaciones',
  '8181567890',
  'miguel.santos@securinorte.com',
  'coordinador',
  true
);