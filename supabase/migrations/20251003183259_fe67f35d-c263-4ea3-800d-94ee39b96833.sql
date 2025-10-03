-- Modificar la función para incluir información del planificador
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
AS $function$
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
      aa.armado_nombre_verificado as armado_nombre,
      CASE
        WHEN sc.nombre_custodio IS NOT NULL AND sc.nombre_custodio != '' AND sc.nombre_custodio != 'Sin Asignar' THEN 'asignado'
        ELSE 'pendiente'
      END as estado_asignacion,
      sc.auto,
      sc.placa,
      -- Información del planificador desde assignment_audit_log
      aal.performed_by as assigned_by,
      p.display_name as planner_name
    FROM servicios_custodia sc
    LEFT JOIN asignacion_armados aa ON sc.id_servicio = aa.servicio_custodia_id 
      AND aa.estado_asignacion IN ('confirmado', 'asignado')
    -- Join con audit log para obtener quien asignó el servicio
    LEFT JOIN LATERAL (
      SELECT performed_by, created_at
      FROM assignment_audit_log
      WHERE service_id = sc.id_servicio
        AND action_type = 'created'
      ORDER BY created_at ASC
      LIMIT 1
    ) aal ON true
    -- Join con profiles para obtener el nombre del planificador
    LEFT JOIN profiles p ON aal.performed_by = p.id
    WHERE DATE(sc.fecha_hora_cita) = date_filter
      -- Exclude cancelled and finished services
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado', 'finished', 'completed')
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
        'armado_nombre', armado_nombre,
        'estado', estado,
        'incluye_armado', incluye_armado,
        'armado_asignado', armado_asignado,
        'estado_asignacion', estado_asignacion,
        'auto', auto,
        'placa', placa,
        'assigned_by', assigned_by,
        'planner_name', planner_name
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
$function$;