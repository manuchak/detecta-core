
-- Función para obtener distribución de ingresos por niveles
CREATE OR REPLACE FUNCTION get_income_distribution_by_threshold()
RETURNS TABLE(
  nivel integer,
  rango_min numeric,
  rango_max numeric,
  custodios_count bigint,
  porcentaje numeric,
  promedio_servicios numeric,
  promedio_ingresos numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH monthly_custodian_income AS (
    SELECT 
      nombre_custodio,
      DATE_TRUNC('month', fecha_hora_cita) as mes,
      COUNT(*) as servicios_mes,
      SUM(CAST(costo_custodio AS numeric)) as ingresos_mes
    FROM servicios_custodia
    WHERE costo_custodio IS NOT NULL 
      AND costo_custodio != ''
      AND costo_custodio != '0'
      AND costo_custodio != '#N/A'
      AND nombre_custodio IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
      AND fecha_hora_cita >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY nombre_custodio, DATE_TRUNC('month', fecha_hora_cita)
    HAVING SUM(CAST(costo_custodio AS numeric)) > 0
  ),
  income_levels AS (
    SELECT 
      CASE 
        WHEN ingresos_mes >= 30000 THEN 5
        WHEN ingresos_mes >= 20000 THEN 4
        WHEN ingresos_mes >= 15000 THEN 3
        WHEN ingresos_mes >= 10000 THEN 2
        ELSE 1
      END as nivel,
      CASE 
        WHEN ingresos_mes >= 30000 THEN 30000
        WHEN ingresos_mes >= 20000 THEN 20000
        WHEN ingresos_mes >= 15000 THEN 15000
        WHEN ingresos_mes >= 10000 THEN 10000
        ELSE 0
      END as rango_min,
      CASE 
        WHEN ingresos_mes >= 30000 THEN 999999
        WHEN ingresos_mes >= 20000 THEN 29999
        WHEN ingresos_mes >= 15000 THEN 19999
        WHEN ingresos_mes >= 10000 THEN 14999
        ELSE 9999
      END as rango_max,
      servicios_mes,
      ingresos_mes
    FROM monthly_custodian_income
  ),
  total_count AS (
    SELECT COUNT(*) as total FROM income_levels
  )
  SELECT 
    il.nivel,
    il.rango_min,
    il.rango_max,
    COUNT(*)::bigint as custodios_count,
    ROUND((COUNT(*)::numeric / tc.total * 100), 1) as porcentaje,
    ROUND(AVG(il.servicios_mes), 1) as promedio_servicios,
    ROUND(AVG(il.ingresos_mes), 0) as promedio_ingresos
  FROM income_levels il
  CROSS JOIN total_count tc
  GROUP BY il.nivel, il.rango_min, il.rango_max, tc.total
  ORDER BY il.nivel;
END;
$function$;

-- Función para obtener métricas de activación
CREATE OR REPLACE FUNCTION get_activation_metrics()
RETURNS TABLE(
  promedio_dias_activacion numeric,
  mediana_dias_activacion numeric,
  activaciones_rapidas_7d bigint,
  activaciones_lentas_14d bigint,
  total_activaciones bigint,
  tasa_activacion_rapida numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH activation_data AS (
    SELECT 
      nombre_custodio,
      MIN(fecha_contratacion) as fecha_contratacion,
      MIN(fecha_hora_cita) as fecha_primer_servicio,
      EXTRACT(days FROM (MIN(fecha_hora_cita) - MIN(fecha_contratacion))) as dias_activacion
    FROM servicios_custodia
    WHERE fecha_contratacion IS NOT NULL 
      AND fecha_hora_cita IS NOT NULL
      AND nombre_custodio IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
    GROUP BY nombre_custodio
    HAVING EXTRACT(days FROM (MIN(fecha_hora_cita) - MIN(fecha_contratacion))) >= 0
  )
  SELECT 
    ROUND(AVG(dias_activacion), 1) as promedio_dias_activacion,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dias_activacion) as mediana_dias_activacion,
    COUNT(*) FILTER (WHERE dias_activacion <= 7)::bigint as activaciones_rapidas_7d,
    COUNT(*) FILTER (WHERE dias_activacion > 14)::bigint as activaciones_lentas_14d,
    COUNT(*)::bigint as total_activaciones,
    ROUND((COUNT(*) FILTER (WHERE dias_activacion <= 7)::numeric / COUNT(*) * 100), 1) as tasa_activacion_rapida
  FROM activation_data;
END;
$function$;

-- Función para obtener matriz de retención por cohortes
CREATE OR REPLACE FUNCTION get_cohort_retention_matrix()
RETURNS TABLE(
  cohorte_mes text,
  mes_0 numeric,
  mes_1 numeric,
  mes_2 numeric,
  mes_3 numeric,
  mes_4 numeric,
  mes_5 numeric,
  custodios_iniciales bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH custodian_cohorts AS (
    SELECT 
      nombre_custodio,
      DATE_TRUNC('month', MIN(fecha_contratacion)) as cohorte_mes
    FROM servicios_custodia
    WHERE fecha_contratacion IS NOT NULL 
      AND nombre_custodio IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
      AND fecha_contratacion >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY nombre_custodio
  ),
  monthly_activity AS (
    SELECT 
      nombre_custodio,
      DATE_TRUNC('month', fecha_hora_cita) as actividad_mes,
      COUNT(*) as servicios
    FROM servicios_custodia
    WHERE fecha_hora_cita IS NOT NULL
      AND nombre_custodio IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
    GROUP BY nombre_custodio, DATE_TRUNC('month', fecha_hora_cita)
  ),
  cohort_retention AS (
    SELECT 
      cc.cohorte_mes,
      COUNT(DISTINCT cc.nombre_custodio) as custodios_iniciales,
      COUNT(DISTINCT CASE WHEN ma0.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_0,
      COUNT(DISTINCT CASE WHEN ma1.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_1,
      COUNT(DISTINCT CASE WHEN ma2.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_2,
      COUNT(DISTINCT CASE WHEN ma3.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_3,
      COUNT(DISTINCT CASE WHEN ma4.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_4,
      COUNT(DISTINCT CASE WHEN ma5.nombre_custodio IS NOT NULL THEN cc.nombre_custodio END) as activos_mes_5
    FROM custodian_cohorts cc
    LEFT JOIN monthly_activity ma0 ON cc.nombre_custodio = ma0.nombre_custodio 
      AND ma0.actividad_mes = cc.cohorte_mes
    LEFT JOIN monthly_activity ma1 ON cc.nombre_custodio = ma1.nombre_custodio 
      AND ma1.actividad_mes = cc.cohorte_mes + INTERVAL '1 month'
    LEFT JOIN monthly_activity ma2 ON cc.nombre_custodio = ma2.nombre_custodio 
      AND ma2.actividad_mes = cc.cohorte_mes + INTERVAL '2 months'
    LEFT JOIN monthly_activity ma3 ON cc.nombre_custodio = ma3.nombre_custodio 
      AND ma3.actividad_mes = cc.cohorte_mes + INTERVAL '3 months'
    LEFT JOIN monthly_activity ma4 ON cc.nombre_custodio = ma4.nombre_custodio 
      AND ma4.actividad_mes = cc.cohorte_mes + INTERVAL '4 months'
    LEFT JOIN monthly_activity ma5 ON cc.nombre_custodio = ma5.nombre_custodio 
      AND ma5.actividad_mes = cc.cohorte_mes + INTERVAL '5 months'
    GROUP BY cc.cohorte_mes
  )
  SELECT 
    TO_CHAR(cohorte_mes, 'YYYY-MM') as cohorte_mes,
    ROUND((activos_mes_0::numeric / custodios_iniciales * 100), 1) as mes_0,
    ROUND((activos_mes_1::numeric / custodios_iniciales * 100), 1) as mes_1,
    ROUND((activos_mes_2::numeric / custodios_iniciales * 100), 1) as mes_2,
    ROUND((activos_mes_3::numeric / custodios_iniciales * 100), 1) as mes_3,
    ROUND((activos_mes_4::numeric / custodios_iniciales * 100), 1) as mes_4,
    ROUND((activos_mes_5::numeric / custodios_iniciales * 100), 1) as mes_5,
    custodios_iniciales
  FROM cohort_retention
  WHERE cohorte_mes >= CURRENT_DATE - INTERVAL '6 months'
  ORDER BY cohorte_mes DESC;
END;
$function$;

-- Función para obtener métricas de productividad mensual
CREATE OR REPLACE FUNCTION get_monthly_productivity_stats()
RETURNS TABLE(
  mes text,
  custodios_activos bigint,
  servicios_promedio numeric,
  ingresos_promedio numeric,
  servicios_totales bigint,
  ingresos_totales numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT 
      DATE_TRUNC('month', fecha_hora_cita) as mes,
      nombre_custodio,
      COUNT(*) as servicios_custodio,
      SUM(CAST(COALESCE(NULLIF(costo_custodio, ''), '0') AS numeric)) as ingresos_custodio
    FROM servicios_custodia
    WHERE fecha_hora_cita >= CURRENT_DATE - INTERVAL '12 months'
      AND nombre_custodio IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
    GROUP BY DATE_TRUNC('month', fecha_hora_cita), nombre_custodio
  )
  SELECT 
    TO_CHAR(mes, 'YYYY-MM') as mes,
    COUNT(DISTINCT nombre_custodio)::bigint as custodios_activos,
    ROUND(AVG(servicios_custodio), 1) as servicios_promedio,
    ROUND(AVG(ingresos_custodio), 0) as ingresos_promedio,
    SUM(servicios_custodio)::bigint as servicios_totales,
    SUM(ingresos_custodio) as ingresos_totales
  FROM monthly_stats
  GROUP BY mes
  ORDER BY mes DESC
  LIMIT 12;
END;
$function$;
