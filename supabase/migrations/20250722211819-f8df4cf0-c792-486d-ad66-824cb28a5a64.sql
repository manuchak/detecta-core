-- Función para obtener custodios activos de los últimos 60 días
CREATE OR REPLACE FUNCTION public.get_active_custodians_60_days()
RETURNS TABLE(count bigint, custodians text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fecha_limite DATE;
BEGIN
  -- Calcular fecha límite: últimos 60 días
  fecha_limite := CURRENT_DATE - INTERVAL '60 days';
  
  RETURN QUERY
  WITH unique_custodians AS (
    SELECT DISTINCT sc.nombre_custodio
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio IS NOT NULL 
      AND TRIM(sc.nombre_custodio) != ''
      AND sc.nombre_custodio != '#N/A'
      AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
      AND sc.fecha_hora_cita <= (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
  )
  SELECT 
    COUNT(*)::bigint as count,
    array_agg(nombre_custodio) as custodians
  FROM unique_custodians;
END;
$function$;