-- Update additional RPC functions to exclude cancelled services  
-- This ensures consistency across all database queries

-- Update get_custodios_estadisticas_planeacion to exclude cancelled services
CREATE OR REPLACE FUNCTION public.get_custodios_estadisticas_planeacion()
 RETURNS TABLE(nombre_custodio text, total_servicios bigint, ultimo_servicio timestamp with time zone, estados text, servicios_finalizados bigint, servicios_activos bigint, km_total numeric, ingresos_total numeric, promedio_km numeric, tasa_finalizacion numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH custodio_stats AS (
    SELECT 
      sc.nombre_custodio,
      COUNT(*) as total_servicios,
      MAX(sc.fecha_hora_cita) as ultimo_servicio,
      STRING_AGG(DISTINCT sc.estado, ', ') as estados,
      COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(sc.estado, ''))) = 'finalizado') as servicios_finalizados,
      COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('finalizado', 'cancelado', 'cancelled', 'canceled')) as servicios_activos,
      COALESCE(SUM(CASE WHEN sc.km_recorridos IS NOT NULL AND sc.km_recorridos != 'NaN' THEN sc.km_recorridos::numeric ELSE 0 END), 0) as km_total,
      COALESCE(SUM(CASE WHEN sc.cobro_cliente IS NOT NULL THEN sc.cobro_cliente ELSE 0 END), 0) as ingresos_total
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio IS NOT NULL 
      AND sc.nombre_custodio != '' 
      AND sc.nombre_custodio != '#N/A'
      AND sc.nombre_custodio != 'Sin Asignar'
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
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
$function$

-- Update get_custodios_nuevos_por_mes to exclude cancelled services
CREATE OR REPLACE FUNCTION public.get_custodios_nuevos_por_mes(fecha_inicio date, fecha_fin date)
 RETURNS TABLE(mes text, custodios_nuevos integer, nombres_custodios text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH primer_servicio_custodio AS (
    SELECT 
      nombre_custodio,
      MIN(fecha_hora_cita) as primer_servicio
    FROM servicios_custodia 
    WHERE nombre_custodio IS NOT NULL 
      AND fecha_hora_cita IS NOT NULL
      AND nombre_custodio != ''
      AND nombre_custodio != '#N/A'
      AND LOWER(TRIM(COALESCE(estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
    GROUP BY nombre_custodio
  ),
  custodios_nuevos_filtrados AS (
    SELECT 
      nombre_custodio,
      primer_servicio,
      TO_CHAR(primer_servicio, 'YYYY-MM') as mes_year
    FROM primer_servicio_custodio
    WHERE primer_servicio >= fecha_inicio
      AND primer_servicio <= fecha_fin
  )
  SELECT 
    cnf.mes_year as mes,
    COUNT(*)::integer as custodios_nuevos,
    array_agg(cnf.nombre_custodio) as nombres_custodios
  FROM custodios_nuevos_filtrados cnf
  GROUP BY cnf.mes_year
  ORDER BY cnf.mes_year;
END;
$function$