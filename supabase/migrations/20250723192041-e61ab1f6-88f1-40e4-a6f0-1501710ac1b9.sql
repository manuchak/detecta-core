-- Función simplificada para ROI marketing real
CREATE OR REPLACE FUNCTION public.get_marketing_roi_simple(periodo_dias integer DEFAULT 90)
RETURNS TABLE(
  total_gastos_marketing numeric,
  total_ingresos_estimados numeric,
  roi_porcentaje numeric,
  candidatos_totales bigint,
  custodios_activos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fecha_limite DATE;
BEGIN
  fecha_limite := CURRENT_DATE - INTERVAL '1 day' * periodo_dias;
  
  RETURN QUERY
  WITH gastos_marketing AS (
    SELECT COALESCE(SUM(monto), 0) as total_gastos
    FROM gastos_externos 
    WHERE fecha_gasto >= fecha_limite
    AND (
      LOWER(concepto) IN ('facebook', 'indeed', 'google', 'linkedin') OR
      LOWER(canal_reclutamiento) IN ('facebook', 'indeed', 'google', 'linkedin')
    )
  ),
  candidatos_marketing AS (
    SELECT 
      COUNT(DISTINCT id) as total_candidatos,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM servicios_custodia sc 
          WHERE LOWER(sc.nombre_custodio) = LOWER(candidatos_custodios.nombre)
          AND sc.fecha_hora_cita >= fecha_limite::timestamp with time zone
          AND LOWER(TRIM(COALESCE(sc.estado, ''))) IN ('completado', 'finalizado')
        ) THEN id 
      END) as custodios_activos
    FROM candidatos_custodios
    WHERE created_at >= fecha_limite::timestamp with time zone
    AND LOWER(fuente_reclutamiento) IN ('online', 'social_media', 'referido')
  ),
  ingresos_estimados AS (
    SELECT cm.custodios_activos * 8500 as ingresos_totales
    FROM candidatos_marketing cm
  )
  SELECT 
    gm.total_gastos,
    ie.ingresos_totales,
    CASE 
      WHEN gm.total_gastos > 0 
      THEN ((ie.ingresos_totales - gm.total_gastos) / gm.total_gastos) * 100
      ELSE 0 
    END as roi_calc,
    cm.total_candidatos,
    cm.custodios_activos
  FROM gastos_marketing gm
  CROSS JOIN candidatos_marketing cm
  CROSS JOIN ingresos_estimados ie;
END;
$$;