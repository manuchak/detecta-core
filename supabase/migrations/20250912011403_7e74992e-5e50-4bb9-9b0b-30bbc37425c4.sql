-- Crear función para comparación MTD (Month-to-Date) justa
CREATE OR REPLACE FUNCTION public.get_mtd_comparison(
  current_year integer, 
  current_month integer, 
  current_day integer, 
  previous_year integer, 
  previous_month integer
)
RETURNS TABLE(
  current_year integer, 
  current_services integer, 
  current_gmv numeric, 
  current_aov numeric,
  previous_year integer, 
  previous_services integer, 
  previous_gmv numeric, 
  previous_aov numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_start_date date;
  current_end_date date;
  previous_start_date date;
  previous_end_date date;
  previous_month_days integer;
BEGIN
  -- Calcular fechas del período actual
  current_start_date := make_date(current_year, current_month, 1);
  current_end_date := make_date(current_year, current_month, current_day);
  
  -- Calcular cuántos días tiene el mes anterior
  previous_month_days := EXTRACT(DAY FROM date_trunc('month', make_date(previous_year, previous_month, 1)) + interval '1 month' - interval '1 day');
  
  -- Calcular fechas del período anterior (misma cantidad de días)
  previous_start_date := make_date(previous_year, previous_month, 1);
  previous_end_date := make_date(previous_year, previous_month, LEAST(current_day, previous_month_days));
  
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      current_year as year,
      COUNT(*)::integer as services,
      COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv
    FROM servicios_custodia 
    WHERE fecha_hora_cita >= current_start_date::timestamp with time zone
      AND fecha_hora_cita <= (current_end_date + interval '23 hours 59 minutes')::timestamp with time zone
      AND estado IS NOT NULL
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  ),
  previous_period AS (
    SELECT 
      previous_year as year,
      COUNT(*)::integer as services,
      COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv
    FROM servicios_custodia 
    WHERE fecha_hora_cita >= previous_start_date::timestamp with time zone
      AND fecha_hora_cita <= (previous_end_date + interval '23 hours 59 minutes')::timestamp with time zone
      AND estado IS NOT NULL
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  )
  SELECT 
    cp.year as current_year,
    cp.services as current_services,
    cp.gmv as current_gmv,
    CASE 
      WHEN cp.services > 0 THEN ROUND(cp.gmv / cp.services, 2)
      ELSE 0 
    END as current_aov,
    pp.year as previous_year,
    pp.services as previous_services,
    pp.gmv as previous_gmv,
    CASE 
      WHEN pp.services > 0 THEN ROUND(pp.gmv / pp.services, 2)
      ELSE 0 
    END as previous_aov
  FROM current_period cp
  CROSS JOIN previous_period pp;
END;
$function$;