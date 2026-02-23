DROP FUNCTION IF EXISTS public.calcular_score_corredor(text);

CREATE OR REPLACE FUNCTION public.calcular_score_corredor(p_carretera text DEFAULT NULL)
RETURNS TABLE (
  carretera character varying,
  total_incidentes bigint,
  incidentes_7d bigint,
  incidentes_30d bigint,
  criticos_30d bigint,
  score_riesgo numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.carretera,
    COUNT(*)::bigint AS total_incidentes,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '7 days')::bigint AS incidentes_7d,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days')::bigint AS incidentes_30d,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days' AND i.severidad IN ('critica', 'alta'))::bigint AS criticos_30d,
    ROUND(
      (
        COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '7 days')::numeric * 3 +
        COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days')::numeric * 1.5 +
        COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days' AND i.severidad IN ('critica', 'alta'))::numeric * 5
      ) / GREATEST(COUNT(*)::numeric, 1),
      2
    ) AS score_riesgo
  FROM incidentes_rrss i
  WHERE i.carretera IS NOT NULL
    AND i.procesado = true
    AND (p_carretera IS NULL OR i.carretera ILIKE '%' || p_carretera || '%')
  GROUP BY i.carretera
  ORDER BY score_riesgo DESC;
END;
$$ LANGUAGE plpgsql;