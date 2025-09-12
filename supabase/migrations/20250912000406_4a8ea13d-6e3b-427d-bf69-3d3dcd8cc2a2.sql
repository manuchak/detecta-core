-- Create function to get YTD data by exact dates for fair comparison
CREATE OR REPLACE FUNCTION public.get_ytd_by_exact_dates(
  start_date_current date,
  end_date_current date,
  start_date_previous date,
  end_date_previous date
)
RETURNS TABLE(
  current_year integer,
  current_services integer,
  current_gmv numeric,
  previous_year integer,
  previous_services integer,
  previous_gmv numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      EXTRACT(YEAR FROM start_date_current)::integer as year,
      COUNT(*)::integer as services,
      COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv
    FROM servicios_custodia 
    WHERE fecha_hora_cita >= start_date_current::timestamp with time zone
      AND fecha_hora_cita <= (end_date_current + interval '1 day')::timestamp with time zone
      AND estado IS NOT NULL
  ),
  previous_period AS (
    SELECT 
      EXTRACT(YEAR FROM start_date_previous)::integer as year,
      COUNT(*)::integer as services,
      COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv
    FROM servicios_custodia 
    WHERE fecha_hora_cita >= start_date_previous::timestamp with time zone
      AND fecha_hora_cita <= (end_date_previous + interval '1 day')::timestamp with time zone
      AND estado IS NOT NULL
  )
  SELECT 
    cp.year as current_year,
    cp.services as current_services,
    cp.gmv as current_gmv,
    pp.year as previous_year,
    pp.services as previous_services,
    pp.gmv as previous_gmv
  FROM current_period cp
  CROSS JOIN previous_period pp;
END;
$function$