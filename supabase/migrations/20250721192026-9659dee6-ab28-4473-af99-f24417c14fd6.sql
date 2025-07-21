-- Crear tabla para seguimiento de rotación de custodios
CREATE TABLE public.custodios_rotacion_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custodio_id TEXT NOT NULL,
  nombre_custodio TEXT NOT NULL,
  zona_operacion TEXT NOT NULL,
  fecha_ultimo_servicio TIMESTAMP WITH TIME ZONE,
  dias_sin_servicio INTEGER DEFAULT 0,
  estado_actividad TEXT DEFAULT 'activo' CHECK (estado_actividad IN ('activo', 'en_riesgo', 'inactivo')),
  total_servicios_historicos INTEGER DEFAULT 0,
  servicios_ultimos_30_dias INTEGER DEFAULT 0,
  promedio_servicios_mes NUMERIC DEFAULT 0,
  fecha_primera_inactividad TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_custodios_rotacion_zona ON public.custodios_rotacion_tracking(zona_operacion);
CREATE INDEX idx_custodios_rotacion_estado ON public.custodios_rotacion_tracking(estado_actividad);
CREATE INDEX idx_custodios_rotacion_custodio_id ON public.custodios_rotacion_tracking(custodio_id);
CREATE INDEX idx_custodios_rotacion_dias_sin_servicio ON public.custodios_rotacion_tracking(dias_sin_servicio);

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_custodios_rotacion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_custodios_rotacion_updated_at
  BEFORE UPDATE ON public.custodios_rotacion_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_custodios_rotacion_timestamp();

-- Función para calcular y actualizar datos de rotación
CREATE OR REPLACE FUNCTION public.actualizar_tracking_rotacion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  custodio_record RECORD;
  dias_sin_actividad INTEGER;
  nuevo_estado TEXT;
  servicios_30_dias INTEGER;
  total_servicios INTEGER;
  promedio_mensual NUMERIC;
BEGIN
  -- Limpiar tabla existente
  DELETE FROM public.custodios_rotacion_tracking;
  
  -- Insertar datos actualizados para cada custodio activo
  FOR custodio_record IN 
    SELECT DISTINCT 
      COALESCE(nombre_custodio, 'Sin nombre') as nombre_custodio,
      COALESCE(id_custodio, 'sin_id') as custodio_id,
      COALESCE(
        CASE 
          WHEN origen LIKE '%CDMX%' OR origen LIKE '%Ciudad de México%' OR origen LIKE '%DF%' THEN 'CDMX'
          WHEN origen LIKE '%Guadalajara%' OR origen LIKE '%Jalisco%' THEN 'Guadalajara'
          WHEN origen LIKE '%Monterrey%' OR origen LIKE '%Nuevo León%' THEN 'Monterrey'
          WHEN origen LIKE '%Puebla%' THEN 'Puebla'
          WHEN origen LIKE '%Tijuana%' THEN 'Tijuana'
          ELSE 'Nacional'
        END, 'Nacional'
      ) as zona_operacion,
      MAX(fecha_hora_cita) as fecha_ultimo_servicio
    FROM servicios_custodia 
    WHERE nombre_custodio IS NOT NULL 
      AND nombre_custodio != '' 
      AND nombre_custodio != '#N/A'
      AND fecha_hora_cita IS NOT NULL
    GROUP BY nombre_custodio, id_custodio, 
      CASE 
        WHEN origen LIKE '%CDMX%' OR origen LIKE '%Ciudad de México%' OR origen LIKE '%DF%' THEN 'CDMX'
        WHEN origen LIKE '%Guadalajara%' OR origen LIKE '%Jalisco%' THEN 'Guadalajara'
        WHEN origen LIKE '%Monterrey%' OR origen LIKE '%Nuevo León%' THEN 'Monterrey'
        WHEN origen LIKE '%Puebla%' THEN 'Puebla'
        WHEN origen LIKE '%Tijuana%' THEN 'Tijuana'
        ELSE 'Nacional'
      END
  LOOP
    -- Calcular días sin servicio
    dias_sin_actividad := COALESCE(
      EXTRACT(DAYS FROM (now() - custodio_record.fecha_ultimo_servicio))::INTEGER, 
      999
    );
    
    -- Determinar estado según días sin actividad
    IF dias_sin_actividad <= 30 THEN
      nuevo_estado := 'activo';
    ELSIF dias_sin_actividad <= 60 THEN
      nuevo_estado := 'en_riesgo';
    ELSE
      nuevo_estado := 'inactivo';
    END IF;
    
    -- Calcular servicios en últimos 30 días
    SELECT COUNT(*) INTO servicios_30_dias
    FROM servicios_custodia
    WHERE nombre_custodio = custodio_record.nombre_custodio
      AND fecha_hora_cita >= (now() - interval '30 days')
      AND estado IN ('finalizado', 'Finalizado', 'completado', 'Completado');
    
    -- Calcular total de servicios históricos
    SELECT COUNT(*) INTO total_servicios
    FROM servicios_custodia
    WHERE nombre_custodio = custodio_record.nombre_custodio
      AND estado IN ('finalizado', 'Finalizado', 'completado', 'Completado');
    
    -- Calcular promedio mensual (últimos 6 meses)
    SELECT COALESCE(COUNT(*) / 6.0, 0) INTO promedio_mensual
    FROM servicios_custodia
    WHERE nombre_custodio = custodio_record.nombre_custodio
      AND fecha_hora_cita >= (now() - interval '6 months')
      AND estado IN ('finalizado', 'Finalizado', 'completado', 'Completado');
    
    -- Insertar registro
    INSERT INTO public.custodios_rotacion_tracking (
      custodio_id,
      nombre_custodio,
      zona_operacion,
      fecha_ultimo_servicio,
      dias_sin_servicio,
      estado_actividad,
      total_servicios_historicos,
      servicios_ultimos_30_dias,
      promedio_servicios_mes,
      fecha_primera_inactividad
    ) VALUES (
      custodio_record.custodio_id,
      custodio_record.nombre_custodio,
      custodio_record.zona_operacion,
      custodio_record.fecha_ultimo_servicio,
      dias_sin_actividad,
      nuevo_estado,
      COALESCE(total_servicios, 0),
      COALESCE(servicios_30_dias, 0),
      COALESCE(promedio_mensual, 0),
      CASE WHEN nuevo_estado = 'inactivo' THEN custodio_record.fecha_ultimo_servicio + interval '60 days' ELSE NULL END
    );
  END LOOP;
  
  RAISE NOTICE 'Tracking de rotación actualizado exitosamente';
END;
$$;

-- Habilitar RLS
ALTER TABLE public.custodios_rotacion_tracking ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Allow authenticated users to read rotation tracking"
ON public.custodios_rotacion_tracking
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir gestión a administradores
CREATE POLICY "Allow admins to manage rotation tracking"
ON public.custodios_rotacion_tracking
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
);

-- Ejecutar la función una vez para poblar la tabla
SELECT public.actualizar_tracking_rotacion();