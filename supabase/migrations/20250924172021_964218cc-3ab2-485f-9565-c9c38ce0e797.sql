-- Crear función para validar IDs únicos entre ambas tablas
CREATE OR REPLACE FUNCTION validate_service_id_globally(p_id_servicio text, p_table_name text DEFAULT NULL, p_record_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  existing_in_custodia RECORD;
  existing_in_planificados RECORD;
  result jsonb;
BEGIN
  -- Verificar en servicios_custodia
  SELECT 
    id_servicio,
    estado,
    created_at,
    nombre_cliente
  INTO existing_in_custodia
  FROM servicios_custodia 
  WHERE id_servicio = p_id_servicio
    AND (p_table_name != 'servicios_custodia' OR id != p_record_id)
  ORDER BY created_at DESC
  LIMIT 1;

  -- Verificar en servicios_planificados  
  SELECT 
    id_servicio,
    estado_planeacion as estado,
    created_at,
    nombre_cliente
  INTO existing_in_planificados
  FROM servicios_planificados 
  WHERE id_servicio = p_id_servicio
    AND (p_table_name != 'servicios_planificados' OR id != p_record_id)
  ORDER BY created_at DESC
  LIMIT 1;

  -- Evaluar resultado
  IF existing_in_custodia IS NOT NULL THEN
    result := jsonb_build_object(
      'is_valid', false,
      'message', 'ID ya existe en servicios activos',
      'existing_service', jsonb_build_object(
        'id_servicio', existing_in_custodia.id_servicio,
        'estado', existing_in_custodia.estado,
        'cliente', existing_in_custodia.nombre_cliente,
        'fecha', existing_in_custodia.created_at,
        'tabla', 'servicios_custodia'
      ),
      'type', 'duplicate_service'
    );
  ELSIF existing_in_planificados IS NOT NULL THEN
    result := jsonb_build_object(
      'is_valid', false,
      'message', 'ID ya existe en servicios planificados',
      'existing_service', jsonb_build_object(
        'id_servicio', existing_in_planificados.id_servicio,
        'estado', existing_in_planificados.estado,
        'cliente', existing_in_planificados.nombre_cliente,
        'fecha', existing_in_planificados.created_at,
        'tabla', 'servicios_planificados'
      ),
      'type', 'duplicate_service'
    );
  ELSE
    result := jsonb_build_object(
      'is_valid', true,
      'message', 'ID disponible para usar',
      'existing_service', null
    );
  END IF;

  RETURN result;
END;
$function$;

-- Agregar índices únicos regulares (no concurrentes para evitar el error de transacción)
CREATE UNIQUE INDEX IF NOT EXISTS idx_servicios_custodia_id_servicio_unique 
ON servicios_custodia (id_servicio) 
WHERE id_servicio IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_servicios_planificados_id_servicio_unique 
ON servicios_planificados (id_servicio) 
WHERE id_servicio IS NOT NULL;