-- Crear tabla de métricas de retención pre-calculadas
CREATE TABLE public.metricas_retencion_mensual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes DATE NOT NULL UNIQUE,
  custodios_mes_anterior INTEGER NOT NULL DEFAULT 0,
  custodios_mes_actual INTEGER NOT NULL DEFAULT 0,
  custodios_retenidos INTEGER NOT NULL DEFAULT 0,
  tasa_retencion NUMERIC(5,2) NOT NULL DEFAULT 0,
  custodios_nuevos INTEGER NOT NULL DEFAULT 0,
  custodios_perdidos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_metricas_retencion_mes ON public.metricas_retencion_mensual(mes DESC);

-- Habilitar RLS
ALTER TABLE public.metricas_retencion_mensual ENABLE ROW LEVEL SECURITY;

-- Política para que todos los usuarios autenticados puedan leer
CREATE POLICY "Usuarios autenticados pueden ver métricas de retención"
ON public.metricas_retencion_mensual
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política para que solo admins puedan modificar
CREATE POLICY "Solo admins pueden modificar métricas de retención"
ON public.metricas_retencion_mensual
FOR ALL
USING (can_access_recruitment_data())
WITH CHECK (can_access_recruitment_data());

-- Función para calcular retención mensual
CREATE OR REPLACE FUNCTION public.calculate_monthly_retention(target_month DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  prev_month_start DATE;
  prev_month_end DATE;
  custodios_anterior INTEGER;
  custodios_actual INTEGER;
  custodios_retenidos INTEGER;
  custodios_nuevos INTEGER;
  custodios_perdidos INTEGER;
  tasa_retencion NUMERIC;
  custodios_anteriores TEXT[];
  custodios_actuales TEXT[];
BEGIN
  -- Calcular fechas del mes objetivo
  month_start := DATE_TRUNC('month', target_month);
  month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Calcular fechas del mes anterior
  prev_month_start := month_start - INTERVAL '1 month';
  prev_month_end := prev_month_start + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Obtener custodios únicos activos en el mes anterior
  SELECT ARRAY_AGG(DISTINCT nombre_custodio) INTO custodios_anteriores
  FROM servicios_custodia
  WHERE fecha_hora_cita >= prev_month_start 
    AND fecha_hora_cita <= prev_month_end
    AND nombre_custodio IS NOT NULL 
    AND TRIM(nombre_custodio) != ''
    AND nombre_custodio != '#N/A'
    AND LOWER(TRIM(COALESCE(estado, ''))) IN ('completado', 'finalizado');
  
  -- Obtener custodios únicos activos en el mes actual
  SELECT ARRAY_AGG(DISTINCT nombre_custodio) INTO custodios_actuales
  FROM servicios_custodia
  WHERE fecha_hora_cita >= month_start 
    AND fecha_hora_cita <= month_end
    AND nombre_custodio IS NOT NULL 
    AND TRIM(nombre_custodio) != ''
    AND nombre_custodio != '#N/A'
    AND LOWER(TRIM(COALESCE(estado, ''))) IN ('completado', 'finalizado');
  
  -- Manejar casos nulos
  custodios_anteriores := COALESCE(custodios_anteriores, ARRAY[]::TEXT[]);
  custodios_actuales := COALESCE(custodios_actuales, ARRAY[]::TEXT[]);
  
  -- Calcular métricas
  custodios_anterior := array_length(custodios_anteriores, 1);
  custodios_actual := array_length(custodios_actuales, 1);
  custodios_anterior := COALESCE(custodios_anterior, 0);
  custodios_actual := COALESCE(custodios_actual, 0);
  
  -- Calcular custodios retenidos (intersección)
  SELECT COUNT(*) INTO custodios_retenidos
  FROM unnest(custodios_anteriores) AS c1
  WHERE c1 = ANY(custodios_actuales);
  
  -- Calcular custodios nuevos (en actual pero no en anterior)
  SELECT COUNT(*) INTO custodios_nuevos
  FROM unnest(custodios_actuales) AS c1
  WHERE NOT (c1 = ANY(custodios_anteriores));
  
  -- Calcular custodios perdidos (en anterior pero no en actual)
  SELECT COUNT(*) INTO custodios_perdidos
  FROM unnest(custodios_anteriores) AS c1
  WHERE NOT (c1 = ANY(custodios_actuales));
  
  -- Calcular tasa de retención
  IF custodios_anterior > 0 THEN
    tasa_retencion := (custodios_retenidos::NUMERIC / custodios_anterior::NUMERIC) * 100;
  ELSE
    tasa_retencion := 0;
  END IF;
  
  -- Insertar o actualizar métricas
  INSERT INTO public.metricas_retencion_mensual (
    mes,
    custodios_mes_anterior,
    custodios_mes_actual,
    custodios_retenidos,
    tasa_retencion,
    custodios_nuevos,
    custodios_perdidos,
    updated_at
  ) VALUES (
    month_start,
    custodios_anterior,
    custodios_actual,
    custodios_retenidos,
    tasa_retencion,
    custodios_nuevos,
    custodios_perdidos,
    now()
  )
  ON CONFLICT (mes) DO UPDATE SET
    custodios_mes_anterior = EXCLUDED.custodios_mes_anterior,
    custodios_mes_actual = EXCLUDED.custodios_mes_actual,
    custodios_retenidos = EXCLUDED.custodios_retenidos,
    tasa_retencion = EXCLUDED.tasa_retencion,
    custodios_nuevos = EXCLUDED.custodios_nuevos,
    custodios_perdidos = EXCLUDED.custodios_perdidos,
    updated_at = now();
END;
$$;

-- Función para poblar datos históricos
CREATE OR REPLACE FUNCTION public.populate_historical_retention_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date DATE := '2025-02-01'; -- Empezar desde febrero (necesitamos enero como mes anterior)
  end_date DATE := DATE_TRUNC('month', CURRENT_DATE);
BEGIN
  WHILE current_date <= end_date LOOP
    PERFORM public.calculate_monthly_retention(current_date);
    current_date := current_date + INTERVAL '1 month';
  END LOOP;
END;
$$;

-- Poblar datos históricos
SELECT public.populate_historical_retention_data();

-- Trigger para actualizar automáticamente cuando se completen servicios
CREATE OR REPLACE FUNCTION public.update_retention_metrics_on_service_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo actualizar si el estado cambió a completado/finalizado
  IF (NEW.estado IN ('completado', 'finalizado', 'Completado', 'Finalizado') AND 
      OLD.estado NOT IN ('completado', 'finalizado', 'Completado', 'Finalizado')) OR
     (TG_OP = 'INSERT' AND NEW.estado IN ('completado', 'finalizado', 'Completado', 'Finalizado')) THEN
    
    -- Actualizar métricas del mes del servicio
    PERFORM public.calculate_monthly_retention(DATE_TRUNC('month', NEW.fecha_hora_cita));
    
    -- Si es diferente al mes actual, también actualizar el mes actual
    IF DATE_TRUNC('month', NEW.fecha_hora_cita) != DATE_TRUNC('month', CURRENT_DATE) THEN
      PERFORM public.calculate_monthly_retention(DATE_TRUNC('month', CURRENT_DATE));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_retention_metrics ON public.servicios_custodia;
CREATE TRIGGER trigger_update_retention_metrics
  AFTER INSERT OR UPDATE ON public.servicios_custodia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_retention_metrics_on_service_completion();