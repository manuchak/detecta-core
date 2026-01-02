-- Update the get_real_planned_services_summary function to include comentarios_planeacion and id_interno_cliente
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
  WITH service_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE sp.custodio_asignado IS NOT NULL AND sp.custodio_asignado <> '') as assigned,
      COUNT(*) FILTER (WHERE sp.custodio_asignado IS NULL OR sp.custodio_asignado = '') as pending,
      COUNT(*) FILTER (WHERE sp.estado_planeacion = 'confirmado') as confirmed
    FROM servicios_planificados sp
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND sp.estado_planeacion != 'cancelado'
  ),
  services_json AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', sp.id,
        'id_servicio', sp.id_servicio,
        'id_interno_cliente', sp.id_interno_cliente,
        'cliente_nombre', sp.cliente_nombre,
        'nombre_cliente', sp.cliente_nombre,
        'empresa_cliente', sp.empresa_cliente,
        'email_cliente', sp.email_cliente,
        'telefono_cliente', sp.telefono_cliente,
        'origen', sp.origen,
        'destino', sp.destino,
        'fecha_hora_cita', sp.fecha_hora_cita,
        'tipo_servicio', sp.tipo_servicio,
        'custodio_nombre', sp.custodio_asignado,
        'custodio_id', sp.custodio_id,
        'armado_nombre', COALESCE(sp.armado_asignado, aa.armado_nombre_verificado),
        'armado_id', aa.armado_id,
        'armado_asignado', COALESCE(sp.armado_asignado, aa.armado_nombre_verificado),
        'estado', sp.estado_planeacion,
        'estado_planeacion', sp.estado_planeacion,
        'incluye_armado', COALESCE(sp.incluye_armado, false),
        'requiere_armado', COALESCE(sp.incluye_armado, false),
        'estado_asignacion', sp.estado_planeacion,
        'auto', NULL,
        'placa', NULL,
        'assigned_by', sp.asignado_por,
        'planner_name', p.full_name,
        'observaciones', sp.observaciones,
        'created_at', sp.created_at,
        'hora_inicio_real', sp.hora_inicio_real,
        'hora_fin_real', sp.hora_fin_real,
        'comentarios_planeacion', sp.comentarios_planeacion
      ) ORDER BY sp.fecha_hora_cita ASC
    ) as data
    FROM servicios_planificados sp
    LEFT JOIN profiles p ON sp.asignado_por = p.id
    LEFT JOIN asignacion_armados aa ON aa.servicio_custodia_id = sp.servicio_custodia_id 
      AND aa.estado_asignacion IN ('confirmado', 'pendiente')
    WHERE DATE(sp.fecha_hora_cita) = date_filter
      AND sp.estado_planeacion != 'cancelado'
  )
  SELECT 
    COALESCE(ss.total, 0)::bigint,
    COALESCE(ss.assigned, 0)::bigint,
    COALESCE(ss.pending, 0)::bigint,
    COALESCE(ss.confirmed, 0)::bigint,
    COALESCE(sj.data, '[]'::jsonb)
  FROM service_stats ss
  CROSS JOIN services_json sj;
END;
$$;