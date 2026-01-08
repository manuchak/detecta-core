-- Corregir función check_custodian_availability para usar timezone CDMX
CREATE OR REPLACE FUNCTION public.check_custodian_availability(
  p_custodio_id uuid, 
  p_fecha_hora_cita timestamp with time zone, 
  p_exclude_service_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  conflict_count INTEGER := 0;
  conflicting_services JSONB := '[]'::jsonb;
  fecha_local DATE;
BEGIN
  -- Convertir fecha a timezone CDMX para comparaciones correctas
  fecha_local := DATE(p_fecha_hora_cita AT TIME ZONE 'America/Mexico_City');

  -- Check for conflicts in planned services usando timezone CDMX
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
    AND DATE(sp.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = fecha_local
    AND ABS(EXTRACT(EPOCH FROM (sp.fecha_hora_cita - p_fecha_hora_cita))) < 28800;

  -- Also check servicios_custodia usando timezone CDMX
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
      AND DATE(sc.fecha_hora_cita AT TIME ZONE 'America/Mexico_City') = fecha_local
      AND ABS(EXTRACT(EPOCH FROM (sc.fecha_hora_cita - p_fecha_hora_cita))) < 28800;
  END IF;

  RETURN jsonb_build_object(
    'has_conflicts', conflict_count > 0,
    'conflict_count', conflict_count,
    'conflicting_services', conflicting_services
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'has_conflicts', false,
      'conflict_count', 0,
      'conflicting_services', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$function$;