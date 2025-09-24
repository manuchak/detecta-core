-- Clean up duplicate validate_service_id_globally functions
-- First, drop all existing versions of the function
DROP FUNCTION IF EXISTS public.validate_service_id_globally(TEXT, UUID);
DROP FUNCTION IF EXISTS public.validate_service_id_globally(TEXT);
DROP FUNCTION IF EXISTS public.validate_service_id_globally(unknown);
DROP FUNCTION IF EXISTS public.validate_service_id_globally(unknown, UUID);

-- Recreate the function with proper type handling
CREATE OR REPLACE FUNCTION public.validate_service_id_globally(
  p_id_servicio TEXT,
  p_record_id UUID DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_custodia RECORD;
  existing_planificado RECORD;
  result jsonb;
BEGIN
  -- Check in servicios_custodia table
  SELECT 
    id_servicio,
    estado,
    created_at,
    nombre_cliente
  INTO existing_custodia
  FROM servicios_custodia 
  WHERE id_servicio = p_id_servicio
    AND (p_record_id IS NULL OR id::text != p_record_id::text)
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check in servicios_planificados table  
  SELECT 
    id_servicio,
    estado_planeacion as estado,
    created_at,
    nombre_cliente
  INTO existing_planificado
  FROM servicios_planificados 
  WHERE id_servicio = p_id_servicio
    AND (p_record_id IS NULL OR id != p_record_id)
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no records exist in either table, it's valid
  IF existing_custodia IS NULL AND existing_planificado IS NULL THEN
    result := jsonb_build_object(
      'is_valid', true,
      'message', 'ID de servicio disponible',
      'existing_service', null
    );
  ELSE
    -- Determine which record to return (prefer custodia over planificado)
    DECLARE
      record_to_check RECORD;
      table_source TEXT;
    BEGIN
      IF existing_custodia IS NOT NULL THEN
        record_to_check := existing_custodia;
        table_source := 'custodia';
      ELSE
        record_to_check := existing_planificado;
        table_source := 'planificado';
      END IF;

      -- Check if the existing service is finished
      IF LOWER(TRIM(COALESCE(record_to_check.estado, ''))) IN ('finalizado', 'completado', 'finished', 'completed') THEN
        result := jsonb_build_object(
          'is_valid', false,
          'message', 'ID ya existe - pertenece a un servicio finalizado',
          'existing_service', jsonb_build_object(
            'id_servicio', record_to_check.id_servicio,
            'estado', record_to_check.estado,
            'cliente', record_to_check.nombre_cliente,
            'fecha', record_to_check.created_at,
            'tabla', table_source
          ),
          'type', 'finished_service'
        );
      ELSE
        result := jsonb_build_object(
          'is_valid', false,
          'message', 'ID ya existe en el sistema',
          'existing_service', jsonb_build_object(
            'id_servicio', record_to_check.id_servicio,
            'estado', record_to_check.estado,
            'cliente', record_to_check.nombre_cliente,
            'fecha', record_to_check.created_at,
            'tabla', table_source
          ),
          'type', 'duplicate_service'
        );
      END IF;
    END;
  END IF;

  RETURN result;
END;
$$;