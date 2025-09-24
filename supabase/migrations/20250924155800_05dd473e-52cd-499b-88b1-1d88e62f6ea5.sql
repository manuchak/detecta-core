-- Step 1: Add validation functions for unique service IDs
CREATE OR REPLACE FUNCTION public.validate_unique_service_id(
  p_id_servicio text,
  p_exclude_finished boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_record RECORD;
  result jsonb;
BEGIN
  -- Check if the service ID already exists
  SELECT 
    id_servicio,
    estado,
    created_at,
    nombre_cliente
  INTO existing_record
  FROM servicios_custodia 
  WHERE id_servicio = p_id_servicio
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no record exists, it's valid
  IF existing_record IS NULL THEN
    result := jsonb_build_object(
      'is_valid', true,
      'message', 'ID de servicio disponible',
      'existing_service', null
    );
  ELSE
    -- Check if the existing service is finished
    IF p_exclude_finished AND LOWER(TRIM(COALESCE(existing_record.estado, ''))) IN ('finalizado', 'completado', 'finished', 'completed') THEN
      result := jsonb_build_object(
        'is_valid', false,
        'message', 'Este ID pertenece a un servicio finalizado - no se puede reutilizar',
        'existing_service', jsonb_build_object(
          'id_servicio', existing_record.id_servicio,
          'estado', existing_record.estado,
          'cliente', existing_record.nombre_cliente,
          'fecha', existing_record.created_at
        ),
        'type', 'finished_service'
      );
    ELSE
      result := jsonb_build_object(
        'is_valid', false,
        'message', 'ID de servicio ya existe en el sistema',
        'existing_service', jsonb_build_object(
          'id_servicio', existing_record.id_servicio,
          'estado', existing_record.estado,
          'cliente', existing_record.nombre_cliente,
          'fecha', existing_record.created_at
        ),
        'type', 'duplicate_service'
      );
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- Step 2: Add bulk validation function for multiple service IDs
CREATE OR REPLACE FUNCTION public.validate_multiple_service_ids(
  p_service_ids text[],
  p_exclude_finished boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  service_id text;
  validation_result jsonb;
  invalid_services jsonb := '[]'::jsonb;
  duplicate_ids text[] := '{}';
  finished_ids text[] := '{}';
  temp_array text[];
BEGIN
  -- Check for duplicates within the input array itself
  SELECT array_agg(DISTINCT unnest) INTO temp_array FROM unnest(p_service_ids);
  IF array_length(temp_array, 1) != array_length(p_service_ids, 1) THEN
    -- Find duplicates in input array
    SELECT array_agg(id) INTO duplicate_ids
    FROM (
      SELECT unnest as id, count(*) as cnt 
      FROM unnest(p_service_ids) 
      GROUP BY unnest 
      HAVING count(*) > 1
    ) dups;
  END IF;

  -- Validate each unique service ID against database
  FOREACH service_id IN ARRAY temp_array
  LOOP
    validation_result := validate_unique_service_id(service_id, p_exclude_finished);
    
    IF (validation_result->>'is_valid')::boolean = false THEN
      invalid_services := invalid_services || jsonb_build_object(
        'id_servicio', service_id,
        'message', validation_result->>'message',
        'type', validation_result->>'type',
        'existing_service', validation_result->'existing_service'
      );
      
      IF validation_result->>'type' = 'finished_service' THEN
        finished_ids := array_append(finished_ids, service_id);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'is_valid', (jsonb_array_length(invalid_services) = 0 AND array_length(duplicate_ids, 1) IS NULL),
    'total_checked', array_length(p_service_ids, 1),
    'invalid_count', jsonb_array_length(invalid_services),
    'duplicate_in_input', duplicate_ids,
    'finished_services', finished_ids,
    'invalid_services', invalid_services,
    'summary', CASE 
      WHEN jsonb_array_length(invalid_services) = 0 AND array_length(duplicate_ids, 1) IS NULL THEN 
        'Todos los IDs son válidos'
      ELSE 
        format('%s IDs problemáticos encontrados', 
          jsonb_array_length(invalid_services) + COALESCE(array_length(duplicate_ids, 1), 0)
        )
    END
  );
END;
$$;

-- Step 3: Update get_scheduled_services_summary to exclude finished services properly
DROP FUNCTION IF EXISTS public.get_scheduled_services_summary(date);

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