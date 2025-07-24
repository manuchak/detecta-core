-- ==========================================
-- ESTRATEGIA COMPLETA DE DÉFICIT DINÁMICO
-- ==========================================

-- 1. TABLA PARA TRACKING DE PRIMER SERVICIO POR ZONA
CREATE TABLE IF NOT EXISTS public.custodios_primer_servicio_zona (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custodio_id TEXT NOT NULL,
  nombre_custodio TEXT NOT NULL,
  zona_operacion TEXT NOT NULL,
  servicio_id TEXT NOT NULL,
  fecha_primer_servicio TIMESTAMP WITH TIME ZONE NOT NULL,
  km_recorridos NUMERIC,
  tipo_servicio TEXT,
  origen TEXT,
  destino TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_custodios_primer_servicio_zona_custodio ON public.custodios_primer_servicio_zona(custodio_id);
CREATE INDEX IF NOT EXISTS idx_custodios_primer_servicio_zona_fecha ON public.custodios_primer_servicio_zona(fecha_primer_servicio);
CREATE INDEX IF NOT EXISTS idx_custodios_primer_servicio_zona_zona ON public.custodios_primer_servicio_zona(zona_operacion);

-- Constraint único para evitar duplicados
ALTER TABLE public.custodios_primer_servicio_zona 
ADD CONSTRAINT unique_custodio_zona UNIQUE (custodio_id, zona_operacion);

-- 2. FUNCIÓN PARA DETECTAR PRIMER SERVICIO POR ZONA
CREATE OR REPLACE FUNCTION public.detectar_primer_servicio_zona()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  zona_detectada TEXT;
  es_primer_servicio BOOLEAN := FALSE;
BEGIN
  -- Solo procesar servicios completados/finalizados
  IF NEW.estado NOT IN ('completado', 'Completado', 'finalizado', 'Finalizado') THEN
    RETURN NEW;
  END IF;

  -- Verificar que tenemos datos esenciales
  IF NEW.id_custodio IS NULL OR NEW.nombre_custodio IS NULL THEN
    RETURN NEW;
  END IF;

  -- Detectar zona basada en origen/destino (mapeo simplificado)
  zona_detectada := CASE 
    WHEN NEW.origen ILIKE '%Ciudad de México%' OR NEW.origen ILIKE '%CDMX%' OR NEW.origen ILIKE '%Distrito Federal%' 
         OR NEW.destino ILIKE '%Ciudad de México%' OR NEW.destino ILIKE '%CDMX%' OR NEW.destino ILIKE '%Distrito Federal%'
    THEN 'Centro de México'
    
    WHEN NEW.origen ILIKE '%Guadalajara%' OR NEW.origen ILIKE '%Jalisco%' OR NEW.origen ILIKE '%Colima%' OR NEW.origen ILIKE '%Nayarit%'
         OR NEW.destino ILIKE '%Guadalajara%' OR NEW.destino ILIKE '%Jalisco%' OR NEW.destino ILIKE '%Colima%' OR NEW.destino ILIKE '%Nayarit%'
    THEN 'Occidente'
    
    WHEN NEW.origen ILIKE '%León%' OR NEW.origen ILIKE '%Querétaro%' OR NEW.origen ILIKE '%Guanajuato%' OR NEW.origen ILIKE '%Aguascalientes%'
         OR NEW.destino ILIKE '%León%' OR NEW.destino ILIKE '%Querétaro%' OR NEW.destino ILIKE '%Guanajuato%' OR NEW.destino ILIKE '%Aguascalientes%'
    THEN 'Bajío'
    
    WHEN NEW.origen ILIKE '%Monterrey%' OR NEW.origen ILIKE '%Nuevo León%' OR NEW.origen ILIKE '%Chihuahua%' OR NEW.origen ILIKE '%Coahuila%'
         OR NEW.destino ILIKE '%Monterrey%' OR NEW.destino ILIKE '%Nuevo León%' OR NEW.destino ILIKE '%Chihuahua%' OR NEW.destino ILIKE '%Coahuila%'
    THEN 'Norte'
    
    WHEN NEW.origen ILIKE '%Tijuana%' OR NEW.origen ILIKE '%Mexicali%' OR NEW.origen ILIKE '%Baja California%' OR NEW.origen ILIKE '%Sonora%'
         OR NEW.destino ILIKE '%Tijuana%' OR NEW.destino ILIKE '%Mexicali%' OR NEW.destino ILIKE '%Baja California%' OR NEW.destino ILIKE '%Sonora%'
    THEN 'Pacífico'
    
    WHEN NEW.origen ILIKE '%Veracruz%' OR NEW.origen ILIKE '%Tampico%' OR NEW.origen ILIKE '%Tamaulipas%'
         OR NEW.destino ILIKE '%Veracruz%' OR NEW.destino ILIKE '%Tampico%' OR NEW.destino ILIKE '%Tamaulipas%'
    THEN 'Golfo'
    
    WHEN NEW.origen ILIKE '%Mérida%' OR NEW.origen ILIKE '%Yucatán%' OR NEW.origen ILIKE '%Cancún%' OR NEW.origen ILIKE '%Quintana Roo%'
         OR NEW.destino ILIKE '%Mérida%' OR NEW.destino ILIKE '%Yucatán%' OR NEW.destino ILIKE '%Cancún%' OR NEW.destino ILIKE '%Quintana Roo%'
    THEN 'Sureste'
    
    ELSE 'Centro-Occidente' -- Zona por defecto para casos no identificados
  END;

  -- Verificar si es el primer servicio del custodio en esta zona
  IF NOT EXISTS (
    SELECT 1 FROM public.custodios_primer_servicio_zona 
    WHERE custodio_id = NEW.id_custodio AND zona_operacion = zona_detectada
  ) THEN
    es_primer_servicio := TRUE;
  END IF;

  -- Si es primer servicio, registrarlo
  IF es_primer_servicio THEN
    INSERT INTO public.custodios_primer_servicio_zona (
      custodio_id,
      nombre_custodio,
      zona_operacion,
      servicio_id,
      fecha_primer_servicio,
      km_recorridos,
      tipo_servicio,
      origen,
      destino
    ) VALUES (
      NEW.id_custodio,
      NEW.nombre_custodio,
      zona_detectada,
      NEW.id_servicio,
      COALESCE(NEW.fecha_hora_cita, now()),
      NEW.km_recorridos,
      NEW.tipo_servicio,
      NEW.origen,
      NEW.destino
    )
    ON CONFLICT (custodio_id, zona_operacion) DO NOTHING;
    
    -- Log para debug
    RAISE NOTICE 'Primer servicio detectado: custodio % en zona % - servicio %', 
      NEW.nombre_custodio, zona_detectada, NEW.id_servicio;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. TRIGGER PARA DETECTAR AUTOMÁTICAMENTE PRIMEROS SERVICIOS
DROP TRIGGER IF EXISTS trigger_detectar_primer_servicio ON public.servicios_custodia;
CREATE TRIGGER trigger_detectar_primer_servicio
  AFTER UPDATE ON public.servicios_custodia
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado'))
  EXECUTE FUNCTION public.detectar_primer_servicio_zona();

-- También para INSERT (nuevos servicios que ya vienen completados)
CREATE TRIGGER trigger_detectar_primer_servicio_insert
  AFTER INSERT ON public.servicios_custodia
  FOR EACH ROW
  WHEN (NEW.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado'))
  EXECUTE FUNCTION public.detectar_primer_servicio_zona();

-- 4. FUNCIÓN PARA CALCULAR DÉFICIT DINÁMICO POR ZONA
CREATE OR REPLACE FUNCTION public.calcular_deficit_dinamico_por_zona(
  p_zona_operacion TEXT,
  p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  zona_operacion TEXT,
  deficit_inicial NUMERIC,
  nuevos_custodios_incorporados INTEGER,
  deficit_ajustado NUMERIC,
  porcentaje_progreso NUMERIC,
  fecha_calculo TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deficit_base NUMERIC := 0;
  incorporaciones INTEGER := 0;
  deficit_final NUMERIC := 0;
  progreso NUMERIC := 0;
BEGIN
  -- Obtener déficit base de la tabla de métricas (simulado por ahora)
  -- En implementación real, esto vendría de la tabla de métricas existente
  deficit_base := CASE p_zona_operacion
    WHEN 'Centro de México' THEN 15
    WHEN 'Bajío' THEN 8 
    WHEN 'Occidente' THEN 6
    WHEN 'Norte' THEN 5
    WHEN 'Pacífico' THEN 4
    WHEN 'Golfo' THEN 3
    WHEN 'Sureste' THEN 2
    ELSE 5
  END;

  -- Contar incorporaciones (primeros servicios) en el período
  SELECT COUNT(*) INTO incorporaciones
  FROM public.custodios_primer_servicio_zona
  WHERE zona_operacion = p_zona_operacion
    AND fecha_primer_servicio::DATE BETWEEN p_fecha_desde AND p_fecha_hasta;

  -- Calcular déficit ajustado
  deficit_final := GREATEST(0, deficit_base - incorporaciones);
  
  -- Calcular porcentaje de progreso
  progreso := CASE 
    WHEN deficit_base > 0 THEN (incorporaciones::NUMERIC / deficit_base) * 100
    ELSE 100
  END;

  RETURN QUERY
  SELECT 
    p_zona_operacion,
    deficit_base,
    incorporaciones,
    deficit_final,
    LEAST(100, progreso), -- Máximo 100%
    now();
END;
$$;

-- 5. FUNCIÓN PARA OBTENER TODAS LAS ZONAS CON DÉFICIT DINÁMICO
CREATE OR REPLACE FUNCTION public.obtener_deficit_dinamico_nacional(
  p_fecha_desde DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_fecha_hasta DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  zona_operacion TEXT,
  deficit_inicial NUMERIC,
  nuevos_custodios_incorporados INTEGER,
  deficit_ajustado NUMERIC,
  porcentaje_progreso NUMERIC,
  estado_progreso TEXT,
  fecha_calculo TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  zona_record TEXT;
  zonas_operacion TEXT[] := ARRAY[
    'Centro de México', 'Bajío', 'Occidente', 'Norte', 
    'Pacífico', 'Golfo', 'Sureste', 'Centro-Occidente'
  ];
BEGIN
  FOREACH zona_record IN ARRAY zonas_operacion
  LOOP
    RETURN QUERY
    SELECT 
      dd.*,
      CASE 
        WHEN dd.porcentaje_progreso >= 90 THEN 'Objetivo Cumplido'
        WHEN dd.porcentaje_progreso >= 70 THEN 'Progreso Excelente'
        WHEN dd.porcentaje_progreso >= 50 THEN 'Progreso Bueno'
        WHEN dd.porcentaje_progreso >= 25 THEN 'Progreso Moderado'
        ELSE 'Necesita Atención'
      END as estado_progreso,
      dd.fecha_calculo
    FROM public.calcular_deficit_dinamico_por_zona(
      zona_record, p_fecha_desde, p_fecha_hasta
    ) dd;
  END LOOP;
END;
$$;

-- 6. TRIGGER PARA ACTUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_custodios_primer_servicio_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_custodios_primer_servicio_timestamp
  BEFORE UPDATE ON public.custodios_primer_servicio_zona
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custodios_primer_servicio_timestamp();

-- 7. PROCESAMIENTO DE DATOS HISTÓRICOS
-- Procesar servicios existentes para detectar primeros servicios históricos
INSERT INTO public.custodios_primer_servicio_zona (
  custodio_id,
  nombre_custodio,
  zona_operacion,
  servicio_id,
  fecha_primer_servicio,
  km_recorridos,
  tipo_servicio,
  origen,
  destino
)
SELECT DISTINCT ON (sc.id_custodio, zona_detectada)
  sc.id_custodio,
  sc.nombre_custodio,
  CASE 
    WHEN sc.origen ILIKE '%Ciudad de México%' OR sc.origen ILIKE '%CDMX%' OR sc.origen ILIKE '%Distrito Federal%' 
         OR sc.destino ILIKE '%Ciudad de México%' OR sc.destino ILIKE '%CDMX%' OR sc.destino ILIKE '%Distrito Federal%'
    THEN 'Centro de México'
    
    WHEN sc.origen ILIKE '%Guadalajara%' OR sc.origen ILIKE '%Jalisco%' OR sc.origen ILIKE '%Colima%' OR sc.origen ILIKE '%Nayarit%'
         OR sc.destino ILIKE '%Guadalajara%' OR sc.destino ILIKE '%Jalisco%' OR sc.destino ILIKE '%Colima%' OR sc.destino ILIKE '%Nayarit%'
    THEN 'Occidente'
    
    WHEN sc.origen ILIKE '%León%' OR sc.origen ILIKE '%Querétaro%' OR sc.origen ILIKE '%Guanajuato%' OR sc.origen ILIKE '%Aguascalientes%'
         OR sc.destino ILIKE '%León%' OR sc.destino ILIKE '%Querétaro%' OR sc.destino ILIKE '%Guanajuato%' OR sc.destino ILIKE '%Aguascalientes%'
    THEN 'Bajío'
    
    WHEN sc.origen ILIKE '%Monterrey%' OR sc.origen ILIKE '%Nuevo León%' OR sc.origen ILIKE '%Chihuahua%' OR sc.origen ILIKE '%Coahuila%'
         OR sc.destino ILIKE '%Monterrey%' OR sc.destino ILIKE '%Nuevo León%' OR sc.destino ILIKE '%Chihuahua%' OR sc.destino ILIKE '%Coahuila%'
    THEN 'Norte'
    
    WHEN sc.origen ILIKE '%Tijuana%' OR sc.origen ILIKE '%Mexicali%' OR sc.origen ILIKE '%Baja California%' OR sc.origen ILIKE '%Sonora%'
         OR sc.destino ILIKE '%Tijuana%' OR sc.destino ILIKE '%Mexicali%' OR sc.destino ILIKE '%Baja California%' OR sc.destino ILIKE '%Sonora%'
    THEN 'Pacífico'
    
    WHEN sc.origen ILIKE '%Veracruz%' OR sc.origen ILIKE '%Tampico%' OR sc.origen ILIKE '%Tamaulipas%'
         OR sc.destino ILIKE '%Veracruz%' OR sc.destino ILIKE '%Tampico%' OR sc.destino ILIKE '%Tamaulipas%'
    THEN 'Golfo'
    
    WHEN sc.origen ILIKE '%Mérida%' OR sc.origen ILIKE '%Yucatán%' OR sc.origen ILIKE '%Cancún%' OR sc.origen ILIKE '%Quintana Roo%'
         OR sc.destino ILIKE '%Mérida%' OR sc.destino ILIKE '%Yucatán%' OR sc.destino ILIKE '%Cancún%' OR sc.destino ILIKE '%Quintana Roo%'
    THEN 'Sureste'
    
    ELSE 'Centro-Occidente'
  END as zona_detectada,
  sc.id_servicio,
  COALESCE(sc.fecha_hora_cita, '2024-01-01'::timestamp),
  sc.km_recorridos,
  sc.tipo_servicio,
  sc.origen,
  sc.destino
FROM public.servicios_custodia sc
WHERE sc.id_custodio IS NOT NULL 
  AND sc.nombre_custodio IS NOT NULL
  AND sc.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
  AND sc.fecha_hora_cita >= '2024-01-01'::timestamp
ORDER BY sc.id_custodio, zona_detectada, sc.fecha_hora_cita ASC
ON CONFLICT (custodio_id, zona_operacion) DO NOTHING;

-- 8. RLS POLICIES
ALTER TABLE public.custodios_primer_servicio_zona ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read primer servicio tracking"
ON public.custodios_primer_servicio_zona
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage primer servicio tracking"
ON public.custodios_primer_servicio_zona
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
);

-- 9. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE public.custodios_primer_servicio_zona IS 'Tracking de primer servicio por custodio por zona para cálculo de déficit dinámico';
COMMENT ON FUNCTION public.calcular_deficit_dinamico_por_zona IS 'Calcula el déficit ajustado considerando incorporaciones recientes';
COMMENT ON FUNCTION public.obtener_deficit_dinamico_nacional IS 'Obtiene el estado del déficit dinámico para todas las zonas operativas';

-- Log de finalización
SELECT 'Estrategia de déficit dinámico implementada correctamente' as status;