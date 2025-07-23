-- Función para calcular ROI de marketing con datos reales
CREATE OR REPLACE FUNCTION public.get_real_marketing_roi(periodo_dias integer DEFAULT 90)
RETURNS TABLE(
  canal text,
  gasto_total numeric,
  candidatos_generados bigint,
  custodios_activos bigint,
  cpa_real numeric,
  ingresos_generados numeric,
  roi_porcentaje numeric,
  roi_total_marketing numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fecha_limite DATE;
  total_gastos_marketing numeric := 0;
  total_ingresos_marketing numeric := 0;
  roi_total numeric := 0;
BEGIN
  fecha_limite := CURRENT_DATE - INTERVAL '1 day' * periodo_dias;
  
  -- Calcular totales de marketing
  SELECT 
    COALESCE(SUM(ge.monto), 0),
    COALESCE(SUM(
      CASE 
        WHEN cc.fuente_reclutamiento = ge.canal_reclutamiento 
        THEN (SELECT COUNT(*) * 15000 -- Estimación de ingresos por custodio activo
              FROM servicios_custodia sc 
              WHERE sc.nombre_custodio = cc.nombre 
              AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
              AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado'))
        ELSE 0
      END
    ), 0)
  INTO total_gastos_marketing, total_ingresos_marketing
  FROM gastos_externos ge
  LEFT JOIN candidatos_custodios cc ON cc.fuente_reclutamiento = ge.canal_reclutamiento
  WHERE ge.fecha_gasto >= fecha_limite
  AND ge.canal_reclutamiento IS NOT NULL;
  
  -- Calcular ROI total
  IF total_gastos_marketing > 0 THEN
    roi_total := ((total_ingresos_marketing - total_gastos_marketing) / total_gastos_marketing) * 100;
  ELSE
    roi_total := 0;
  END IF;
  
  RETURN QUERY
  WITH marketing_data AS (
    SELECT 
      COALESCE(ge.canal_reclutamiento, 'Sin Canal') as canal_marketing,
      SUM(ge.monto) as gastos_canal,
      COUNT(DISTINCT cc.id) as candidatos_canal,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM servicios_custodia sc 
          WHERE sc.nombre_custodio = cc.nombre 
          AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
          AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        ) THEN cc.id 
      END) as custodios_activos_canal
    FROM gastos_externos ge
    LEFT JOIN candidatos_custodios cc ON cc.fuente_reclutamiento = ge.canal_reclutamiento
    WHERE ge.fecha_gasto >= fecha_limite
    AND ge.canal_reclutamiento IS NOT NULL
    GROUP BY ge.canal_reclutamiento
  ),
  ingresos_por_canal AS (
    SELECT 
      md.canal_marketing,
      md.gastos_canal,
      md.candidatos_canal,
      md.custodios_activos_canal,
      CASE 
        WHEN md.candidatos_canal > 0 
        THEN md.gastos_canal / md.candidatos_canal 
        ELSE 0 
      END as cpa_calculado,
      -- Calcular ingresos reales basados en servicios completados
      COALESCE((
        SELECT SUM(sc.cobro_cliente * 0.15) -- 15% de comisión estimada
        FROM servicios_custodia sc
        JOIN candidatos_custodios cc ON cc.nombre = sc.nombre_custodio
        WHERE cc.fuente_reclutamiento = md.canal_marketing
        AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
        AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        AND sc.cobro_cliente > 0
      ), md.custodios_activos_canal * 15000) as ingresos_canal -- Fallback a estimación
    FROM marketing_data md
  )
  SELECT 
    ipc.canal_marketing::text,
    ipc.gastos_canal,
    ipc.candidatos_canal::bigint,
    ipc.custodios_activos_canal::bigint,
    ipc.cpa_calculado,
    ipc.ingresos_canal,
    CASE 
      WHEN ipc.gastos_canal > 0 
      THEN ((ipc.ingresos_canal - ipc.gastos_canal) / ipc.gastos_canal) * 100
      ELSE 0 
    END as roi_canal,
    roi_total
  FROM ingresos_por_canal ipc
  WHERE ipc.gastos_canal > 0
  ORDER BY 
    CASE 
      WHEN ipc.gastos_canal > 0 
      THEN ((ipc.ingresos_canal - ipc.gastos_canal) / ipc.gastos_canal) * 100
      ELSE 0 
    END DESC;
END;
$$;