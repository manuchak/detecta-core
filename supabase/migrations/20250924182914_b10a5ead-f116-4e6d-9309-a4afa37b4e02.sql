-- Function to check for custodian schedule conflicts
CREATE OR REPLACE FUNCTION public.check_custodian_availability(
  p_custodio_id UUID,
  p_fecha_hora_cita TIMESTAMP WITH TIME ZONE,
  p_exclude_service_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  conflict_count INTEGER;
  conflicting_services JSONB;
BEGIN
  -- Check for conflicts in planned services
  SELECT 
    COUNT(*),
    jsonb_agg(
      jsonb_build_object(
        'id_servicio', id_servicio,
        'fecha_hora_cita', fecha_hora_cita,
        'origen', origen,
        'destino', destino
      )
    )
  INTO conflict_count, conflicting_services
  FROM servicios_planificados
  WHERE custodio_id = p_custodio_id
    AND (p_exclude_service_id IS NULL OR id != p_exclude_service_id)
    AND estado_planeacion NOT IN ('cancelado', 'completado')
    AND fecha_hora_cita::DATE = p_fecha_hora_cita::DATE
    AND ABS(EXTRACT(EPOCH FROM (fecha_hora_cita - p_fecha_hora_cita))) < 3600; -- Within 1 hour

  RETURN jsonb_build_object(
    'has_conflicts', conflict_count > 0,
    'conflict_count', conflict_count,
    'conflicting_services', COALESCE(conflicting_services, '[]'::jsonb)
  );
END;
$function$;