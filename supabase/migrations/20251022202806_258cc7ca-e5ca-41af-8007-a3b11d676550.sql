-- Actualizar get_real_planned_services_summary para incluir id_servicio
CREATE OR REPLACE FUNCTION public.get_real_planned_services_summary(date_filter date)
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
      sp.id_servicio,
      sp.nombre_cliente AS cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado,
      sp.custodio_id,
      sp.requiere_armado,
      sp.estado_planeacion,
      sp.tipo_servicio,
      sp.observaciones,
      -- Buscar armado asignado de la tabla asignacion_armados
      aa.armado_nombre_verificado as armado_nombre,
      aa.armado_id,
      aa.estado_asignacion
    FROM public.servicios_planificados sp
    LEFT JOIN public.asignacion_armados aa ON sp.id_servicio = aa.servicio_custodia_id
      AND aa.estado_asignacion IN ('confirmado', 'asignado', 'pendiente')
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND COALESCE(sp.estado_planeacion, '') NOT IN ('cancelado', 'finalizado')
  )
  SELECT 
    COUNT(*)::bigint AS total_services,
    COUNT(*) FILTER (WHERE custodio_asignado IS NOT NULL AND TRIM(custodio_asignado) <> '')::bigint AS assigned_services,
    COUNT(*) FILTER (WHERE custodio_asignado IS NULL OR TRIM(custodio_asignado) = '')::bigint AS pending_services,
    COUNT(*) FILTER (WHERE estado_planeacion = 'confirmado')::bigint AS confirmed_services,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'id_servicio', id_servicio,
          'cliente_nombre', cliente_nombre,
          'origen', origen,
          'destino', destino,
          'fecha_hora_cita', fecha_hora_cita,
          'tipo_servicio', tipo_servicio,
          'custodio_nombre', custodio_asignado,
          'custodio_id', custodio_id::text,
          'armado_nombre', armado_nombre,
          'armado_id', armado_id::text,
          'estado', estado_planeacion,
          'incluye_armado', COALESCE(requiere_armado, false),
          'armado_asignado', (armado_nombre IS NOT NULL),
          'estado_asignacion', estado_asignacion,
          'observaciones', observaciones,
          'auto', NULL,
          'placa', NULL,
          'assigned_by', NULL,
          'planner_name', NULL
        )
        ORDER BY fecha_hora_cita ASC
      ), '[]'::jsonb
    ) AS services_data
  FROM servicios_del_dia;
END;
$$;