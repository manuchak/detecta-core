-- Función mejorada para calcular ROI de marketing con correlación correcta
CREATE OR REPLACE FUNCTION public.get_real_marketing_roi_v2(periodo_dias integer DEFAULT 90)
RETURNS TABLE(
  canal text,
  gasto_total numeric,
  candidatos_generados bigint,
  custodios_activos bigint,
  cpa_real numeric,
  ingresos_generados numeric,
  roi_porcentaje numeric,
  roi_total_marketing numeric,
  desglose_calculo jsonb
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
  
  RETURN QUERY
  WITH gastos_marketing AS (
    SELECT 
      CASE 
        WHEN LOWER(ge.canal_reclutamiento) LIKE '%facebook%' OR LOWER(ge.concepto) LIKE '%facebook%' THEN 'Facebook'
        WHEN LOWER(ge.canal_reclutamiento) LIKE '%indeed%' OR LOWER(ge.concepto) LIKE '%indeed%' THEN 'Indeed'
        WHEN LOWER(ge.canal_reclutamiento) LIKE '%google%' OR LOWER(ge.concepto) LIKE '%google%' THEN 'Google'
        WHEN LOWER(ge.canal_reclutamiento) LIKE '%linkedin%' OR LOWER(ge.concepto) LIKE '%linkedin%' THEN 'LinkedIn'
        ELSE COALESCE(ge.canal_reclutamiento, ge.concepto, 'Directo')
      END as canal_normalizado,
      SUM(ge.monto) as total_gasto
    FROM gastos_externos ge
    WHERE ge.fecha_gasto >= fecha_limite
    AND (ge.canal_reclutamiento IS NOT NULL OR LOWER(ge.concepto) IN ('facebook', 'indeed', 'google', 'linkedin'))
    GROUP BY 1
  ),
  candidatos_por_canal AS (
    SELECT 
      CASE 
        WHEN LOWER(cc.fuente_reclutamiento) LIKE '%facebook%' THEN 'Facebook'
        WHEN LOWER(cc.fuente_reclutamiento) LIKE '%indeed%' THEN 'Indeed'
        WHEN LOWER(cc.fuente_reclutamiento) LIKE '%google%' THEN 'Google'
        WHEN LOWER(cc.fuente_reclutamiento) LIKE '%linkedin%' THEN 'LinkedIn'
        ELSE COALESCE(cc.fuente_reclutamiento, 'Directo')
      END as canal_normalizado,
      COUNT(DISTINCT cc.id) as total_candidatos,
      -- Contar custodios activos basado en servicios en el período
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM servicios_custodia sc 
          WHERE LOWER(sc.nombre_custodio) = LOWER(cc.nombre)
          AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
          AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        ) THEN cc.id 
      END) as custodios_activos
    FROM candidatos_custodios cc
    WHERE cc.created_at >= fecha_limite::timestamp with time zone
    GROUP BY 1
  ),
  ingresos_por_canal AS (
    SELECT 
      cpc.canal_normalizado,
      COALESCE(gm.total_gasto, 0) as gastos,
      cpc.total_candidatos,
      cpc.custodios_activos,
      -- Calcular ingresos reales basados en servicios completados
      COALESCE((
        SELECT SUM(sc.cobro_cliente * 0.15) -- 15% de comisión
        FROM servicios_custodia sc
        JOIN candidatos_custodios cc ON LOWER(cc.nombre) = LOWER(sc.nombre_custodio)
        WHERE CASE 
          WHEN LOWER(cc.fuente_reclutamiento) LIKE '%facebook%' THEN 'Facebook'
          WHEN LOWER(cc.fuente_reclutamiento) LIKE '%indeed%' THEN 'Indeed'
          WHEN LOWER(cc.fuente_reclutamiento) LIKE '%google%' THEN 'Google'
          WHEN LOWER(cc.fuente_reclutamiento) LIKE '%linkedin%' THEN 'LinkedIn'
          ELSE COALESCE(cc.fuente_reclutamiento, 'Directo')
        END = cpc.canal_normalizado
        AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
        AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        AND sc.cobro_cliente > 0
      ), cpc.custodios_activos * 8500) as ingresos_estimados -- Fallback más conservador
    FROM candidatos_por_canal cpc
    LEFT JOIN gastos_marketing gm ON gm.canal_normalizado = cpc.canal_normalizado
  ),
  totales AS (
    SELECT 
      SUM(ipc.gastos) as total_gastos,
      SUM(ipc.ingresos_estimados) as total_ingresos
    FROM ingresos_por_canal ipc
  ),
  resultados_finales AS (
    SELECT 
      ipc.canal_normalizado::text as canal_resultado,
      ipc.gastos,
      ipc.total_candidatos::bigint,
      ipc.custodios_activos::bigint,
      CASE 
        WHEN ipc.total_candidatos > 0 
        THEN ipc.gastos / ipc.total_candidatos 
        ELSE 0 
      END as cpa,
      ipc.ingresos_estimados,
      CASE 
        WHEN ipc.gastos > 0 
        THEN ((ipc.ingresos_estimados - ipc.gastos) / ipc.gastos) * 100
        ELSE 0 
      END as roi_canal,
      CASE 
        WHEN t.total_gastos > 0 
        THEN ((t.total_ingresos - t.total_gastos) / t.total_gastos) * 100
        ELSE 0 
      END as roi_global,
      jsonb_build_object(
        'gastos', ipc.gastos,
        'ingresos', ipc.ingresos_estimados,
        'candidatos', ipc.total_candidatos,
        'custodios_activos', ipc.custodios_activos,
        'periodo_dias', periodo_dias,
        'fecha_limite', fecha_limite
      ) as desglose
    FROM ingresos_por_canal ipc
    CROSS JOIN totales t
    WHERE ipc.gastos > 0 OR ipc.custodios_activos > 0
  )
  SELECT 
    rf.canal_resultado,
    rf.gastos,
    rf.total_candidatos,
    rf.custodios_activos,
    rf.cpa,
    rf.ingresos_estimados,
    rf.roi_canal,
    rf.roi_global,
    rf.desglose
  FROM resultados_finales rf
  ORDER BY rf.roi_canal DESC;
END;
$$;