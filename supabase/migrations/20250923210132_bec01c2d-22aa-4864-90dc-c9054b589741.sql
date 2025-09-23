-- Paso 1: Eliminar la función existente que tiene parámetros incorrectos
DROP FUNCTION IF EXISTS public.get_scheduled_services_summary(date);

-- Paso 2: Crear la función corregida
CREATE OR REPLACE FUNCTION public.get_scheduled_services_summary(date_filter date)
RETURNS TABLE(
  total_services integer,
  assigned_services integer,
  pending_services integer,
  confirmed_services integer,
  services_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_services AS (
    SELECT 
      sc.id_servicio,
      sc.nombre_cliente as cliente_nombre,
      sc.origen,
      sc.destino,
      sc.fecha_hora_cita,
      sc.nombre_custodio as custodio_nombre,
      sc.estado,
      CASE 
        WHEN UPPER(TRIM(COALESCE(sc.armado, 'FALSE'))) = 'TRUE' THEN true 
        ELSE false 
      END as incluye_armado,
      CASE 
        WHEN aa.id IS NOT NULL THEN true 
        ELSE false 
      END as armado_asignado,
      CASE
        WHEN sc.nombre_custodio IS NOT NULL AND sc.nombre_custodio != '' AND sc.nombre_custodio != 'Sin Asignar' THEN 'asignado'
        ELSE 'pendiente'
      END as estado_asignacion,
      sc.auto,
      sc.placa
    FROM servicios_custodia sc
    LEFT JOIN asignacion_armados aa ON sc.id_servicio = aa.servicio_custodia_id 
      AND aa.estado_asignacion IN ('confirmado', 'asignado')
    WHERE DATE(sc.fecha_hora_cita) = date_filter
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled')
  ),
  summary_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(*) FILTER (WHERE estado_asignacion = 'asignado')::integer as assigned,
      COUNT(*) FILTER (WHERE estado_asignacion = 'pendiente')::integer as pending,
      COUNT(*) FILTER (WHERE LOWER(TRIM(estado)) = 'confirmado')::integer as confirmed
    FROM filtered_services
  ),
  services_array AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id_servicio,
        'cliente_nombre', cliente_nombre,
        'origen', origen,
        'destino', destino,
        'fecha_hora_cita', fecha_hora_cita,
        'custodio_nombre', custodio_nombre,
        'estado', estado,
        'incluye_armado', incluye_armado,
        'armado_asignado', armado_asignado,
        'estado_asignacion', estado_asignacion,
        'auto', auto,
        'placa', placa
      )
    ) as services_json
    FROM filtered_services
  )
  SELECT 
    ss.total as total_services,
    ss.assigned as assigned_services,
    ss.pending as pending_services,
    ss.confirmed as confirmed_services,
    COALESCE(sa.services_json, '[]'::jsonb) as services_data
  FROM summary_stats ss
  CROSS JOIN services_array sa;
END;
$$;