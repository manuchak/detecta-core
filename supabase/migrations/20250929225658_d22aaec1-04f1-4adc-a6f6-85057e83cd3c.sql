-- Fix get_planned_services_summary: return real UUID id and explicit id_servicio
DROP FUNCTION IF EXISTS public.get_planned_services_summary(date);

CREATE OR REPLACE FUNCTION public.get_planned_services_summary(date_filter date)
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
      sp.id, -- real UUID id
      sp.id_servicio, -- external/display id
      sp.nombre_cliente as cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado as custodio_nombre,
      sp.armado_asignado as armado_nombre,
      sp.estado_planeacion as estado,
      sp.requiere_armado as incluye_armado,
      CASE WHEN sp.armado_asignado IS NOT NULL AND sp.armado_asignado != '' THEN true ELSE false END as armado_asignado_bool,
      CASE
        WHEN sp.custodio_asignado IS NOT NULL AND sp.custodio_asignado != '' THEN 'asignado'
        ELSE 'pendiente'
      END as estado_asignacion,
      sp.auto,
      sp.placa
    FROM servicios_planificados sp
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
  ),
  summary_stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(*) FILTER (WHERE estado_asignacion = 'asignado')::integer as assigned,
      COUNT(*) FILTER (WHERE estado_asignacion = 'pendiente')::integer as pending,
      COUNT(*) FILTER (WHERE estado = 'confirmado')::integer as confirmed
    FROM filtered_services
  ),
  services_array AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'id_servicio', id_servicio,
        'cliente_nombre', cliente_nombre,
        'origen', origen,
        'destino', destino,
        'fecha_hora_cita', fecha_hora_cita,
        'custodio_nombre', custodio_nombre,
        'armado_nombre', armado_nombre,
        'estado', estado,
        'incluye_armado', incluye_armado,
        'armado_asignado', armado_asignado_bool,
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