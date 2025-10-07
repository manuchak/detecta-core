-- Función SQL para calcular percentiles de permanencia de custodios
CREATE OR REPLACE FUNCTION calculate_custodian_permanence_percentiles(
  min_services integer DEFAULT 3,
  start_date date DEFAULT '2024-01-01'
)
RETURNS TABLE (
  mediana numeric,
  promedio numeric,
  p10 numeric,
  p25 numeric,
  p75 numeric,
  p90 numeric,
  custodios_analizados bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH permanencia_custodios AS (
    SELECT 
      nombre_custodio,
      EXTRACT(EPOCH FROM (MAX(fecha_hora_cita) - MIN(fecha_hora_cita))) / (30.44 * 24 * 3600) as permanencia_meses,
      COUNT(*) as total_servicios
    FROM servicios_custodia
    WHERE nombre_custodio IS NOT NULL 
      AND fecha_hora_cita >= start_date::timestamp with time zone
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
    GROUP BY nombre_custodio
    HAVING COUNT(*) >= min_services
  )
  SELECT 
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY permanencia_meses)::numeric, 2) as mediana,
    ROUND(AVG(permanencia_meses)::numeric, 2) as promedio,
    ROUND(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY permanencia_meses)::numeric, 2) as p10,
    ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY permanencia_meses)::numeric, 2) as p25,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY permanencia_meses)::numeric, 2) as p75,
    ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY permanencia_meses)::numeric, 2) as p90,
    COUNT(*)::bigint as custodios_analizados
  FROM permanencia_custodios;
END;
$$;

-- Comentario descriptivo
COMMENT ON FUNCTION calculate_custodian_permanence_percentiles IS 
'Calcula percentiles de permanencia real de custodios basado en análisis de cohortes. 
Retorna mediana (P50), promedio, P10, P25, P75, P90 y cantidad de custodios analizados.
Utilizado para KPIs dinámicos de retención con límites basados en datos reales.';
