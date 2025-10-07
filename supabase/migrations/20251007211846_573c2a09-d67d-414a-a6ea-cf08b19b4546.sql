-- Crear función para obtener resumen de servicios planificados real
CREATE OR REPLACE FUNCTION get_real_planned_services_summary(date_filter date)
RETURNS TABLE(
  total_services bigint,
  assigned_services bigint,
  pending_services bigint,
  confirmed_services bigint,
  services_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH servicios_del_dia AS (
    SELECT 
      sp.id,
      sp.cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado,
      COALESCE(sp.armado_asignado, '') as armado_nombre,
      sp.estado_planeacion as estado,
      COALESCE(sp.incluye_armado, false) as incluye_armado,
      COALESCE(sp.armado_asignado_confirmado, false) as armado_asignado,
      sp.estado_asignacion_custodio as estado_asignacion,
      sp.auto,
      sp.placa,
      sp.asignado_por_usuario_id as assigned_by,
      p.display_name as planner_name
    FROM servicios_planificados sp
    LEFT JOIN profiles p ON sp.asignado_por_usuario_id = p.id
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND sp.estado_planeacion NOT IN ('cancelado', 'finalizado')
  )
  SELECT 
    COUNT(*)::bigint as total_services,
    COUNT(*) FILTER (WHERE custodio_asignado IS NOT NULL AND custodio_asignado != '')::bigint as assigned_services,
    COUNT(*) FILTER (WHERE custodio_asignado IS NULL OR custodio_asignado = '')::bigint as pending_services,
    COUNT(*) FILTER (WHERE estado = 'confirmado')::bigint as confirmed_services,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'cliente_nombre', cliente_nombre,
          'origen', origen,
          'destino', destino,
          'fecha_hora_cita', fecha_hora_cita,
          'custodio_nombre', custodio_asignado,
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
        ORDER BY fecha_hora_cita ASC
      ),
      '[]'::jsonb
    ) as services_data
  FROM servicios_del_dia;
END;
$$;