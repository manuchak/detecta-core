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
      sp.cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado,
      sp.estado_planeacion
    FROM public.servicios_planificados sp
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
          'cliente_nombre', cliente_nombre,
          'origen', origen,
          'destino', destino,
          'fecha_hora_cita', fecha_hora_cita,
          'custodio_nombre', custodio_asignado,
          'armado_nombre', NULL,
          'estado', estado_planeacion,
          'incluye_armado', false,
          'armado_asignado', false,
          'estado_asignacion', NULL,
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