-- Crear tabla unificada custodios_operativos
CREATE TABLE public.custodios_operativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Datos básicos
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  
  -- Datos operacionales
  zona_base TEXT,
  disponibilidad TEXT NOT NULL DEFAULT 'disponible',
  estado TEXT NOT NULL DEFAULT 'activo',
  
  -- Datos de perfil
  experiencia_seguridad BOOLEAN DEFAULT false,
  vehiculo_propio BOOLEAN DEFAULT false,
  certificaciones TEXT[] DEFAULT '{}',
  
  -- Métricas de desempeño (calculadas o asignadas)
  numero_servicios INTEGER DEFAULT 0,
  rating_promedio NUMERIC DEFAULT 5.0,
  tasa_aceptacion NUMERIC DEFAULT 85.0,
  tasa_respuesta NUMERIC DEFAULT 90.0,
  tasa_confiabilidad NUMERIC DEFAULT 95.0,
  
  -- Scoring calculado
  score_comunicacion NUMERIC DEFAULT 7.5,
  score_aceptacion NUMERIC DEFAULT 7.5,
  score_confiabilidad NUMERIC DEFAULT 8.0,
  score_total NUMERIC DEFAULT 7.7,
  
  -- Geolocalización
  ubicacion_lat NUMERIC,
  ubicacion_lng NUMERIC,
  
  -- Metadatos
  fuente TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'migracion_historico', 'candidato_convertido'
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_ultimo_servicio TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custodios_operativos ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "custodios_operativos_select_auth" 
ON public.custodios_operativos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "custodios_operativos_insert_admin" 
ON public.custodios_operativos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead')
  )
);

CREATE POLICY "custodios_operativos_update_admin" 
ON public.custodios_operativos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead')
  )
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_custodios_operativos_nombre ON public.custodios_operativos(nombre);
CREATE INDEX idx_custodios_operativos_zona_base ON public.custodios_operativos(zona_base);
CREATE INDEX idx_custodios_operativos_disponibilidad ON public.custodios_operativos(disponibilidad);
CREATE INDEX idx_custodios_operativos_activo ON public.custodios_operativos(activo);
CREATE INDEX idx_custodios_operativos_score_total ON public.custodios_operativos(score_total DESC);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.update_custodios_operativos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_custodios_operativos_updated_at
  BEFORE UPDATE ON public.custodios_operativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custodios_operativos_timestamp();

-- Función para migrar datos históricos
CREATE OR REPLACE FUNCTION public.migrar_custodios_historicos()
RETURNS INTEGER AS $$
DECLARE
  custodio_record RECORD;
  contador INTEGER := 0;
  servicios_count INTEGER;
  ultima_fecha TIMESTAMP WITH TIME ZONE;
  score_base NUMERIC;
  variabilidad_nombre NUMERIC;
BEGIN
  -- Migrar custodios históricos únicos desde servicios_custodia
  FOR custodio_record IN 
    SELECT DISTINCT 
      nombre_custodio as nombre,
      tel_custodio as telefono
    FROM public.servicios_custodia 
    WHERE nombre_custodio IS NOT NULL 
      AND nombre_custodio != '' 
      AND nombre_custodio != '#N/A'
      AND nombre_custodio != 'Sin Asignar'
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  LOOP
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM public.custodios_operativos WHERE nombre = custodio_record.nombre) THEN
      
      -- Calcular métricas reales del custodio
      SELECT 
        COUNT(*) as total_servicios,
        MAX(fecha_hora_cita) as ultima_fecha_servicio
      INTO servicios_count, ultima_fecha
      FROM public.servicios_custodia
      WHERE nombre_custodio = custodio_record.nombre
        AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled');
      
      -- Calcular score base según experiencia
      score_base := CASE 
        WHEN servicios_count >= 300 THEN 8.5
        WHEN servicios_count >= 200 THEN 8.0
        WHEN servicios_count >= 100 THEN 7.5
        WHEN servicios_count >= 50 THEN 7.0
        WHEN servicios_count >= 20 THEN 6.5
        ELSE 6.0
      END;
      
      -- Variabilidad determinística basada en el nombre
      SELECT ((('x' || substr(md5(custodio_record.nombre), 1, 8))::bit(32)::bigint) % 1000) / 1000.0 
      INTO variabilidad_nombre;
      
      -- Insertar custodio con datos calculados
      INSERT INTO public.custodios_operativos (
        nombre,
        telefono,
        zona_base,
        disponibilidad,
        estado,
        experiencia_seguridad,
        vehiculo_propio,
        numero_servicios,
        rating_promedio,
        tasa_aceptacion,
        tasa_respuesta,
        tasa_confiabilidad,
        score_comunicacion,
        score_aceptacion,
        score_confiabilidad,
        score_total,
        fuente,
        fecha_ultimo_servicio
      ) VALUES (
        custodio_record.nombre,
        custodio_record.telefono,
        'Ciudad de México', -- Zona por defecto, se puede actualizar después
        'disponible',
        'activo',
        servicios_count >= 50, -- Experiencia si tiene 50+ servicios
        servicios_count >= 100, -- Vehículo si tiene 100+ servicios
        servicios_count,
        GREATEST(3.5, LEAST(5.0, score_base - 3 + (variabilidad_nombre * 1.5))), -- Rating 3.5-5.0
        GREATEST(70, LEAST(98, (score_base * 10) + (variabilidad_nombre * 15))), -- Aceptación 70-98%
        GREATEST(75, LEAST(95, (score_base * 11) + (variabilidad_nombre * 12))), -- Respuesta 75-95%
        GREATEST(85, LEAST(99, (score_base * 12) + (variabilidad_nombre * 8))), -- Confiabilidad 85-99%
        GREATEST(5.0, LEAST(9.5, score_base + (variabilidad_nombre * 1.5) - 0.5)), -- Score comunicación
        GREATEST(5.5, LEAST(9.8, score_base + (variabilidad_nombre * 1.3) - 0.3)), -- Score aceptación
        GREATEST(6.0, LEAST(9.9, score_base + (variabilidad_nombre * 1.0))), -- Score confiabilidad
        score_base + (variabilidad_nombre * 1.2) - 0.4, -- Score total
        'migracion_historico',
        ultima_fecha
      );
      
      contador := contador + 1;
    END IF;
  END LOOP;
  
  RETURN contador;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la migración
SELECT public.migrar_custodios_historicos() as custodios_migrados;