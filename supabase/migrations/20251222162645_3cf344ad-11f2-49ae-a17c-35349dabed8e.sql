-- Create materialized view for operational KPIs cache
-- This pre-aggregates monthly metrics for fast dashboard loading

CREATE MATERIALIZED VIEW IF NOT EXISTS kpis_operacionales_cache AS
SELECT 
  DATE_TRUNC('month', fecha_hora_cita) as mes,
  EXTRACT(YEAR FROM fecha_hora_cita)::INTEGER as anio,
  EXTRACT(MONTH FROM fecha_hora_cita)::INTEGER as mes_numero,
  COUNT(*) as total_servicios,
  COUNT(*) FILTER (WHERE estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')) as completados,
  COUNT(*) FILTER (WHERE estado IN ('cancelado', 'Cancelado')) as cancelados,
  COUNT(*) FILTER (WHERE estado NOT IN ('completado', 'Completado', 'finalizado', 'Finalizado', 'cancelado', 'Cancelado')) as pendientes,
  COALESCE(SUM(cobro_cliente) FILTER (WHERE estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')), 0) as gmv,
  COALESCE(AVG(cobro_cliente) FILTER (WHERE estado IN ('completado', 'Completado', 'finalizado', 'Finalizado') AND cobro_cliente > 0), 0) as aov,
  COUNT(DISTINCT nombre_custodio) FILTER (WHERE nombre_custodio IS NOT NULL AND nombre_custodio != '#N/A') as custodios_activos,
  COUNT(DISTINCT nombre_cliente) FILTER (WHERE nombre_cliente IS NOT NULL AND nombre_cliente != '#N/A') as clientes_activos,
  COALESCE(AVG(km_recorridos) FILTER (WHERE km_recorridos > 0 AND estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')), 0) as avg_km,
  COALESCE(SUM(CAST(costo_custodio AS NUMERIC)) FILTER (WHERE estado IN ('completado', 'Completado', 'finalizado', 'Finalizado') AND costo_custodio IS NOT NULL), 0) as costo_total_custodios
FROM servicios_custodia
WHERE fecha_hora_cita >= NOW() - INTERVAL '3 years'
  AND fecha_hora_cita IS NOT NULL
GROUP BY DATE_TRUNC('month', fecha_hora_cita), EXTRACT(YEAR FROM fecha_hora_cita), EXTRACT(MONTH FROM fecha_hora_cita)
ORDER BY mes DESC;

-- Create unique index for efficient refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpis_cache_mes ON kpis_operacionales_cache (mes);

-- Create index on year-month for filtering
CREATE INDEX IF NOT EXISTS idx_kpis_cache_anio_mes ON kpis_operacionales_cache (anio, mes_numero);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_kpis_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpis_operacionales_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment explaining usage
COMMENT ON MATERIALIZED VIEW kpis_operacionales_cache IS 'Pre-aggregated monthly KPIs for fast dashboard loading. Refresh with: SELECT refresh_kpis_cache();';