-- Limpiar tabla existente y recrear correctamente
DROP TABLE IF EXISTS public.custodios_operativos CASCADE;

-- Crear tabla custodios_operativos con campos correctos
CREATE TABLE public.custodios_operativos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Campos básicos
  nombre text NOT NULL,
  telefono text, -- Campo correcto según servicios_custodia
  email text,
  
  -- Campos operacionales
  zona_base text,
  disponibilidad text DEFAULT 'disponible',
  estado text DEFAULT 'activo',
  
  -- Campos de perfil
  experiencia_seguridad boolean DEFAULT false,
  vehiculo_propio boolean DEFAULT false,
  certificaciones text[] DEFAULT '{}',
  
  -- Métricas de performance
  numero_servicios integer DEFAULT 0,
  rating_promedio numeric DEFAULT 0,
  tasa_aceptacion numeric DEFAULT 0,
  tasa_respuesta numeric DEFAULT 0,
  tasa_confiabilidad numeric DEFAULT 0,
  
  -- Scores calculados
  score_comunicacion numeric DEFAULT 0,
  score_aceptacion numeric DEFAULT 0,
  score_confiabilidad numeric DEFAULT 0,
  score_total numeric DEFAULT 0,
  
  -- Geolocalización
  lat numeric,
  lng numeric,
  
  -- Metadata
  fuente text DEFAULT 'manual',
  fecha_ultimo_servicio timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraint de unicidad por nombre
  CONSTRAINT custodios_operativos_nombre_unique UNIQUE (nombre)
);

-- Habilitar RLS
ALTER TABLE public.custodios_operativos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "custodios_operativos_read" 
ON public.custodios_operativos FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "custodios_operativos_admin_manage" 
ON public.custodios_operativos FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
);

-- Índices para optimizar consultas
CREATE INDEX idx_custodios_operativos_nombre ON public.custodios_operativos(nombre);
CREATE INDEX idx_custodios_operativos_zona ON public.custodios_operativos(zona_base);
CREATE INDEX idx_custodios_operativos_estado ON public.custodios_operativos(estado);
CREATE INDEX idx_custodios_operativos_disponibilidad ON public.custodios_operativos(disponibilidad);
CREATE INDEX idx_custodios_operativos_score_total ON public.custodios_operativos(score_total DESC);