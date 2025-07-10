-- Crear función para obtener datos históricos mensuales para Holt-Winters
CREATE OR REPLACE FUNCTION public.get_historical_monthly_data()
 RETURNS TABLE(
   year integer,
   month integer, 
   services integer,
   gmv numeric,
   services_completed integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM fecha_hora_cita)::integer as year,
    EXTRACT(MONTH FROM fecha_hora_cita)::integer as month,
    COUNT(*)::integer as services,
    COALESCE(SUM(CASE WHEN cobro_cliente > 0 THEN cobro_cliente ELSE 0 END), 0) as gmv,
    COUNT(*) FILTER (WHERE estado IN ('finalizado', 'Finalizado', 'completado', 'Completado'))::integer as services_completed
  FROM servicios_custodia 
  WHERE fecha_hora_cita IS NOT NULL 
    AND fecha_hora_cita >= '2023-01-01'
    AND estado IS NOT NULL
  GROUP BY EXTRACT(YEAR FROM fecha_hora_cita), EXTRACT(MONTH FROM fecha_hora_cita)
  ORDER BY year, month;
END;
$function$;