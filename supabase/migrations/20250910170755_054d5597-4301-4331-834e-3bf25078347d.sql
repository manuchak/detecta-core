-- Crear función para calcular Supply Growth de manera consistente
CREATE OR REPLACE FUNCTION public.get_supply_growth_metrics(
  fecha_inicio DATE,
  fecha_fin DATE
)
RETURNS TABLE(supply_growth_rate NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  custodios_inicio INTEGER;
  custodios_fin INTEGER;
  growth_rate NUMERIC;
BEGIN
  -- Calcular custodios únicos al inicio del período
  SELECT COUNT(DISTINCT nombre_custodio) INTO custodios_inicio
  FROM servicios_custodia
  WHERE nombre_custodio IS NOT NULL 
    AND nombre_custodio != '' 
    AND nombre_custodio != '#N/A'
    AND fecha_hora_cita >= fecha_inicio
    AND fecha_hora_cita < fecha_inicio + INTERVAL '1 month';
  
  -- Calcular custodios únicos al final del período
  SELECT COUNT(DISTINCT nombre_custodio) INTO custodios_fin
  FROM servicios_custodia
  WHERE nombre_custodio IS NOT NULL 
    AND nombre_custodio != '' 
    AND nombre_custodio != '#N/A'
    AND fecha_hora_cita >= fecha_fin - INTERVAL '1 month'
    AND fecha_hora_cita <= fecha_fin;
  
  -- Calcular tasa de crecimiento
  IF custodios_inicio > 0 THEN
    growth_rate := ((custodios_fin - custodios_inicio)::NUMERIC / custodios_inicio::NUMERIC) * 100;
  ELSE
    growth_rate := 0;
  END IF;
  
  RETURN QUERY SELECT ROUND(growth_rate, 2);
END;
$$;