-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_supply_growth_metrics(date, date);

-- Create improved supply growth metrics function
CREATE OR REPLACE FUNCTION public.get_supply_growth_metrics(
  fecha_inicio date,
  fecha_fin date
)
RETURNS TABLE(
  period_start text,
  period_end text,
  custodios_nuevos integer,
  custodios_perdidos integer,
  custodios_activos_inicio integer,
  custodios_activos_fin integer,
  supply_growth_rate numeric,
  supply_growth_absolute integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fecha_inicio_anterior date;
  custodios_activos_mes_actual integer;
  custodios_activos_mes_anterior integer;
  nuevos_custodios integer;
  custodios_perdidos_calc integer;
  crecimiento_absoluto integer;
  tasa_crecimiento numeric;
BEGIN
  -- Calcular fecha del mes anterior para comparación
  fecha_inicio_anterior := fecha_inicio - interval '1 month';
  
  -- Custodios activos en el mes actual (tuvieron al menos un servicio completado)
  SELECT COUNT(DISTINCT nombre_custodio) INTO custodios_activos_mes_actual
  FROM servicios_custodia
  WHERE fecha_hora_cita >= fecha_inicio::timestamp with time zone
    AND fecha_hora_cita < fecha_fin::timestamp with time zone
    AND nombre_custodio IS NOT NULL
    AND TRIM(nombre_custodio) != ''
    AND nombre_custodio != '#N/A'
    AND estado IN ('completado', 'Completado', 'finalizado', 'Finalizado');
  
  -- Custodios activos en el mes anterior
  SELECT COUNT(DISTINCT nombre_custodio) INTO custodios_activos_mes_anterior
  FROM servicios_custodia
  WHERE fecha_hora_cita >= fecha_inicio_anterior::timestamp with time zone
    AND fecha_hora_cita < fecha_inicio::timestamp with time zone
    AND nombre_custodio IS NOT NULL
    AND TRIM(nombre_custodio) != ''
    AND nombre_custodio != '#N/A'
    AND estado IN ('completado', 'Completado', 'finalizado', 'Finalizado');
  
  -- Si no hay mes anterior, usar el mes actual como base
  IF custodios_activos_mes_anterior = 0 THEN
    custodios_activos_mes_anterior := custodios_activos_mes_actual;
  END IF;
  
  -- Nuevos custodios: aquellos que aparecen por primera vez en el mes actual
  SELECT COUNT(DISTINCT sc_actual.nombre_custodio) INTO nuevos_custodios
  FROM servicios_custodia sc_actual
  WHERE sc_actual.fecha_hora_cita >= fecha_inicio::timestamp with time zone
    AND sc_actual.fecha_hora_cita < fecha_fin::timestamp with time zone
    AND sc_actual.nombre_custodio IS NOT NULL
    AND TRIM(sc_actual.nombre_custodio) != ''
    AND sc_actual.nombre_custodio != '#N/A'
    AND sc_actual.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
    AND NOT EXISTS (
      SELECT 1 FROM servicios_custodia sc_anterior
      WHERE sc_anterior.nombre_custodio = sc_actual.nombre_custodio
        AND sc_anterior.fecha_hora_cita < fecha_inicio::timestamp with time zone
        AND sc_anterior.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
    );
  
  -- Custodios perdidos: estaban activos el mes anterior pero no el actual
  -- Y no han tenido servicios en los últimos 90 días
  SELECT COUNT(DISTINCT sc_anterior.nombre_custodio) INTO custodios_perdidos_calc
  FROM servicios_custodia sc_anterior
  WHERE sc_anterior.fecha_hora_cita >= fecha_inicio_anterior::timestamp with time zone
    AND sc_anterior.fecha_hora_cita < fecha_inicio::timestamp with time zone
    AND sc_anterior.nombre_custodio IS NOT NULL
    AND TRIM(sc_anterior.nombre_custodio) != ''
    AND sc_anterior.nombre_custodio != '#N/A'
    AND sc_anterior.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
    AND NOT EXISTS (
      SELECT 1 FROM servicios_custodia sc_actual
      WHERE sc_actual.nombre_custodio = sc_anterior.nombre_custodio
        AND sc_actual.fecha_hora_cita >= fecha_inicio::timestamp with time zone
        AND sc_actual.fecha_hora_cita < fecha_fin::timestamp with time zone
        AND sc_actual.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
    )
    AND NOT EXISTS (
      SELECT 1 FROM servicios_custodia sc_reciente
      WHERE sc_reciente.nombre_custodio = sc_anterior.nombre_custodio
        AND sc_reciente.fecha_hora_cita >= (fecha_fin - interval '90 days')::timestamp with time zone
        AND sc_reciente.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado')
    );
  
  -- Calcular crecimiento absoluto y tasa
  crecimiento_absoluto := custodios_activos_mes_actual - custodios_activos_mes_anterior;
  
  -- Calcular tasa de crecimiento
  IF custodios_activos_mes_anterior > 0 THEN
    tasa_crecimiento := (crecimiento_absoluto::numeric / custodios_activos_mes_anterior::numeric) * 100;
  ELSE
    tasa_crecimiento := 0;
  END IF;
  
  -- Retornar resultados
  period_start := fecha_inicio::text;
  period_end := fecha_fin::text;
  custodios_nuevos := nuevos_custodios;
  custodios_perdidos := custodios_perdidos_calc;
  custodios_activos_inicio := custodios_activos_mes_anterior;
  custodios_activos_fin := custodios_activos_mes_actual;
  supply_growth_rate := ROUND(tasa_crecimiento, 2);
  supply_growth_absolute := crecimiento_absoluto;
  
  RETURN NEXT;
END;
$$;