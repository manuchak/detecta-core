-- Optimizar validate_multiple_service_ids con batch query
-- Cambia de O(n) queries a O(1) query usando LEFT JOIN

CREATE OR REPLACE FUNCTION public.validate_multiple_service_ids(
  p_service_ids text[],
  p_exclude_finished boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout = '10s'
AS $$
DECLARE
  invalid_services jsonb := '[]'::jsonb;
  duplicate_ids text[] := '{}';
  finished_ids text[] := '{}';
  unique_ids text[];
BEGIN
  -- Remove duplicates from input array
  SELECT array_agg(DISTINCT unnest) INTO unique_ids FROM unnest(p_service_ids);
  
  -- Find duplicates in input
  IF array_length(unique_ids, 1) != array_length(p_service_ids, 1) THEN
    SELECT array_agg(id) INTO duplicate_ids
    FROM (
      SELECT unnest as id, count(*) as cnt 
      FROM unnest(p_service_ids) 
      GROUP BY unnest 
      HAVING count(*) > 1
    ) dups;
  END IF;

  -- Batch validation: Check all IDs in one query using LEFT JOIN
  WITH existing_in_active AS (
    SELECT id_servicio, estado, nombre_cliente as cliente, created_at::text as fecha
    FROM servicios_custodia
    WHERE id_servicio = ANY(unique_ids)
  ),
  existing_in_finished AS (
    SELECT id_servicio, estado, cliente, fecha
    FROM servicios_finalizados
    WHERE id_servicio = ANY(unique_ids)
      AND p_exclude_finished = true
  ),
  validation_results AS (
    SELECT 
      input_id,
      f.id_servicio as finished_id,
      a.id_servicio as active_id,
      CASE 
        WHEN f.id_servicio IS NOT NULL THEN 'finished_service'
        WHEN a.id_servicio IS NOT NULL THEN 'duplicate_service'
        ELSE NULL
      END as error_type,
      CASE 
        WHEN f.id_servicio IS NOT NULL THEN to_jsonb(f.*)
        WHEN a.id_servicio IS NOT NULL THEN to_jsonb(a.*)
        ELSE NULL
      END as existing_service
    FROM unnest(unique_ids) AS input_id
    LEFT JOIN existing_in_finished f ON f.id_servicio = input_id
    LEFT JOIN existing_in_active a ON a.id_servicio = input_id
  )
  SELECT 
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id_servicio', input_id,
          'message', CASE 
            WHEN error_type = 'finished_service' THEN 'ID ya existe - pertenece a un servicio finalizado'
            WHEN error_type = 'duplicate_service' THEN 'ID ya existe en el sistema'
          END,
          'type', error_type,
          'existing_service', existing_service
        )
      ) FILTER (WHERE error_type IS NOT NULL),
      '[]'::jsonb
    ),
    array_agg(input_id) FILTER (WHERE finished_id IS NOT NULL)
  INTO invalid_services, finished_ids
  FROM validation_results;

  -- Clean up null arrays
  IF finished_ids IS NULL THEN
    finished_ids := '{}';
  END IF;

  RETURN jsonb_build_object(
    'is_valid', (jsonb_array_length(invalid_services) = 0 AND array_length(duplicate_ids, 1) IS NULL),
    'total_checked', array_length(p_service_ids, 1),
    'invalid_count', jsonb_array_length(invalid_services),
    'duplicate_in_input', COALESCE(duplicate_ids, '{}'),
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