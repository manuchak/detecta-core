-- Crear tabla de datos fiscales (si no existe)
CREATE TABLE IF NOT EXISTS public.instaladores_datos_fiscales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalador_id UUID REFERENCES public.instaladores(id) ON DELETE CASCADE NOT NULL,
  rfc TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  regimen_fiscal TEXT NOT NULL,
  direccion_fiscal TEXT NOT NULL,
  ciudad_fiscal TEXT NOT NULL,
  estado_fiscal TEXT NOT NULL,
  codigo_postal_fiscal TEXT NOT NULL,
  email_facturacion TEXT NOT NULL,
  telefono_facturacion TEXT,
  banco TEXT,
  cuenta_bancaria TEXT,
  clabe_interbancaria TEXT,
  titular_cuenta TEXT,
  documentos_fiscales JSONB DEFAULT '{}',
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES auth.users(id),
  fecha_verificacion TIMESTAMP WITH TIME ZONE,
  observaciones_verificacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de evidencias de instalación (si no existe)
CREATE TABLE IF NOT EXISTS public.evidencias_instalacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID NOT NULL,
  instalador_id UUID REFERENCES public.instaladores(id) NOT NULL,
  tipo_evidencia TEXT NOT NULL CHECK (tipo_evidencia IN ('foto_antes', 'foto_durante', 'foto_despues', 'video_funcionamiento', 'documento_entrega', 'firma_cliente')),
  archivo_url TEXT NOT NULL,
  descripcion TEXT,
  timestamp_captura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ubicacion_gps POINT,
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES auth.users(id),
  fecha_verificacion TIMESTAMP WITH TIME ZONE,
  observaciones_verificacion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de auditoría de instalaciones (si no existe)
CREATE TABLE IF NOT EXISTS public.auditoria_instalaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacion_id UUID NOT NULL,
  instalador_id UUID REFERENCES public.instaladores(id) NOT NULL,
  auditor_id UUID REFERENCES auth.users(id) NOT NULL,
  estado_auditoria TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado_auditoria IN ('en_revision', 'aprobada', 'rechazada', 'requiere_correccion')),
  puntuacion_tecnica INTEGER CHECK (puntuacion_tecnica >= 1 AND puntuacion_tecnica <= 10),
  puntuacion_evidencias INTEGER CHECK (puntuacion_evidencias >= 1 AND puntuacion_evidencias <= 10),
  puntuacion_documentacion INTEGER CHECK (puntuacion_documentacion >= 1 AND puntuacion_documentacion <= 10),
  puntuacion_general INTEGER CHECK (puntuacion_general >= 1 AND puntuacion_general <= 10),
  aspectos_positivos TEXT[],
  aspectos_mejora TEXT[],
  observaciones TEXT,
  requiere_seguimiento BOOLEAN DEFAULT false,
  fecha_auditoria TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_resolucion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar columnas faltantes a la tabla instaladores existente si no las tiene
ALTER TABLE public.instaladores 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS codigo_instalador TEXT,
ADD COLUMN IF NOT EXISTS experiencia_años INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS zona_cobertura TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certificaciones JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS herramientas_propias BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vehiculo_propio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disponibilidad_horarios JSONB DEFAULT '{"lunes_viernes": true, "sabados": true, "domingos": false}',
ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_instalaciones INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instalaciones_exitosas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_instaladores_datos_fiscales_instalador ON public.instaladores_datos_fiscales(instalador_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_programacion ON public.evidencias_instalacion(programacion_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_instalador ON public.evidencias_instalacion(instalador_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos_instaladores(estado_pago);
CREATE INDEX IF NOT EXISTS idx_auditoria_estado ON public.auditoria_instalaciones(estado_auditoria);

-- Enable RLS en las nuevas tablas
ALTER TABLE public.instaladores_datos_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencias_instalacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_instalaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para datos fiscales
CREATE POLICY "Instaladores pueden gestionar sus datos fiscales" 
ON public.instaladores_datos_fiscales FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.instaladores 
    WHERE id = instaladores_datos_fiscales.instalador_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins pueden gestionar datos fiscales" 
ON public.instaladores_datos_fiscales FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Políticas RLS para evidencias
CREATE POLICY "Instaladores pueden gestionar sus evidencias" 
ON public.evidencias_instalacion FOR ALL 
USING (instalador_id IN (
  SELECT id FROM public.instaladores WHERE user_id = auth.uid()
));

CREATE POLICY "Coordinadores pueden ver evidencias" 
ON public.evidencias_instalacion FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Políticas RLS para auditoría
CREATE POLICY "Instaladores pueden ver sus auditorías" 
ON public.auditoria_instalaciones FOR SELECT 
USING (instalador_id IN (
  SELECT id FROM public.instaladores WHERE user_id = auth.uid()
));

CREATE POLICY "Auditores pueden gestionar auditorías" 
ON public.auditoria_instalaciones FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Trigger para actualizar updated_at en las nuevas tablas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_instaladores_datos_fiscales_updated_at
  BEFORE UPDATE ON public.instaladores_datos_fiscales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_auditoria_instalaciones_updated_at
  BEFORE UPDATE ON public.auditoria_instalaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();