-- Crear función optimizada para métricas de activación que evite timeouts
CREATE OR REPLACE FUNCTION public.get_activation_metrics()
RETURNS TABLE(
  total_custodians integer,
  activated_custodians integer,
  activation_rate numeric,
  median_activation_days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH custodian_activation AS (
    SELECT 
      sc.nombre_custodio,
      MIN(sc.fecha_hora_cita) as first_service_date,
      COUNT(*) as service_count
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio IS NOT NULL 
      AND sc.nombre_custodio != ''
      AND sc.nombre_custodio != '#N/A'
      AND sc.fecha_hora_cita >= (CURRENT_DATE - INTERVAL '90 days')
    GROUP BY sc.nombre_custodio
    LIMIT 1000 -- Limitar para evitar timeouts
  ),
  activation_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(*) FILTER (WHERE service_count >= 3)::integer as activated,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(days FROM (CURRENT_DATE - first_service_date))) as median_days
    FROM custodian_activation
  )
  SELECT 
    as.total,
    as.activated,
    CASE 
      WHEN as.total > 0 THEN ROUND((as.activated::numeric / as.total) * 100, 2)
      ELSE 0
    END as activation_rate,
    COALESCE(as.median_days, 0) as median_activation_days
  FROM activation_stats as;
END;
$$;