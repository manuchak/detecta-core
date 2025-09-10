-- Crear función para obtener estadísticas de custodios desde servicios_custodia
CREATE OR REPLACE FUNCTION public.get_custodios_estadisticas_planeacion()
RETURNS TABLE(
  nombre_custodio TEXT,
  total_servicios BIGINT,
  ultimo_servicio TIMESTAMP WITH TIME ZONE,
  estados TEXT,
  servicios_finalizados BIGINT,
  servicios_activos BIGINT,
  km_total NUMERIC,
  ingresos_total NUMERIC,
  promedio_km NUMERIC,
  tasa_finalizacion NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH custodio_stats AS (
    SELECT 
      sc.nombre_custodio,
      COUNT(*) as total_servicios,
      MAX(sc.fecha_hora_cita) as ultimo_servicio,
      STRING_AGG(DISTINCT sc.estado, ', ') as estados,
      COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(sc.estado, ''))) = 'finalizado') as servicios_finalizados,
      COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('finalizado', 'cancelado')) as servicios_activos,
      COALESCE(SUM(CASE WHEN sc.km_recorridos IS NOT NULL AND sc.km_recorridos != 'NaN' THEN sc.km_recorridos::numeric ELSE 0 END), 0) as km_total,
      COALESCE(SUM(CASE WHEN sc.cobro_cliente IS NOT NULL THEN sc.cobro_cliente ELSE 0 END), 0) as ingresos_total
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio IS NOT NULL 
      AND sc.nombre_custodio != '' 
      AND sc.nombre_custodio != '#N/A'
      AND sc.nombre_custodio != 'Sin Asignar'
    GROUP BY sc.nombre_custodio
  )
  SELECT 
    cs.nombre_custodio,
    cs.total_servicios,
    cs.ultimo_servicio,
    cs.estados,
    cs.servicios_finalizados,
    cs.servicios_activos,
    cs.km_total,
    cs.ingresos_total,
    CASE 
      WHEN cs.total_servicios > 0 THEN ROUND(cs.km_total / cs.total_servicios, 2)
      ELSE 0 
    END as promedio_km,
    CASE 
      WHEN cs.total_servicios > 0 THEN ROUND((cs.servicios_finalizados::numeric / cs.total_servicios::numeric) * 100, 2)
      ELSE 0 
    END as tasa_finalizacion
  FROM custodio_stats cs
  ORDER BY cs.ultimo_servicio DESC NULLS LAST;
END;
$$;