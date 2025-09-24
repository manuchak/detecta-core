-- SPRINT 4: Fix RPC function structure mismatches

-- Drop and recreate get_planned_services_summary with correct return type
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
      sp.id_servicio,
      sp.nombre_cliente as cliente_nombre,
      sp.origen,
      sp.destino,
      sp.fecha_hora_cita,
      sp.custodio_asignado as custodio_nombre,
      sp.estado_planeacion as estado,
      sp.requiere_armado as incluye_armado,
      CASE WHEN sp.armado_asignado IS NOT NULL THEN true ELSE false END as armado_asignado,
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

-- Fix check_custodian_availability function to use maybeSingle pattern
DROP FUNCTION IF EXISTS public.check_custodian_availability(uuid, timestamp with time zone, uuid);

CREATE OR REPLACE FUNCTION public.check_custodian_availability(
  p_custodio_id uuid, 
  p_fecha_hora_cita timestamp with time zone, 
  p_exclude_service_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conflict_count INTEGER := 0;
  conflicting_services JSONB := '[]'::jsonb;
BEGIN
  -- Check for conflicts in planned services
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id_servicio', sp.id_servicio,
        'fecha_hora_cita', sp.fecha_hora_cita,
        'origen', sp.origen,
        'destino', sp.destino,
        'nombre_cliente', sp.nombre_cliente
      )
    ) FILTER (WHERE sp.id IS NOT NULL), '[]'::jsonb)
  INTO conflict_count, conflicting_services
  FROM servicios_planificados sp
  WHERE sp.custodio_id = p_custodio_id
    AND (p_exclude_service_id IS NULL OR sp.id != p_exclude_service_id)
    AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
    AND DATE(sp.fecha_hora_cita) = DATE(p_fecha_hora_cita)
    AND ABS(EXTRACT(EPOCH FROM (sp.fecha_hora_cita - p_fecha_hora_cita))) < 28800; -- Within 8 hours

  -- Also check servicios_custodia for additional conflicts
  IF conflict_count = 0 THEN
    SELECT 
      COALESCE(COUNT(*), 0),
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id_servicio', sc.id_servicio,
          'fecha_hora_cita', sc.fecha_hora_cita,
          'origen', sc.origen,
          'destino', sc.destino,
          'nombre_cliente', sc.nombre_cliente
        )
      ) FILTER (WHERE sc.id IS NOT NULL), '[]'::jsonb)
    INTO conflict_count, conflicting_services
    FROM servicios_custodia sc
    WHERE sc.nombre_custodio = (
      SELECT nombre FROM custodios_operativos WHERE id = p_custodio_id LIMIT 1
    )
      AND LOWER(TRIM(COALESCE(sc.estado, ''))) NOT IN ('cancelado', 'cancelled', 'canceled', 'finalizado', 'completado')
      AND DATE(sc.fecha_hora_cita) = DATE(p_fecha_hora_cita)
      AND ABS(EXTRACT(EPOCH FROM (sc.fecha_hora_cita - p_fecha_hora_cita))) < 28800; -- Within 8 hours
  END IF;

  RETURN jsonb_build_object(
    'has_conflicts', conflict_count > 0,
    'conflict_count', conflict_count,
    'conflicting_services', conflicting_services
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return no conflicts on error to avoid blocking UI
    RETURN jsonb_build_object(
      'has_conflicts', false,
      'conflict_count', 0,
      'conflicting_services', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;