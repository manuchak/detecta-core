-- FASE 1: Corregir función RPC get_custodio_vehicle_data
CREATE OR REPLACE FUNCTION public.get_custodio_vehicle_data(p_custodio_nombre text)
RETURNS TABLE(
  marca text,
  modelo text,
  placa text,
  color text,
  tipo_custodio text,
  fuente text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cv.marca, 'No especificado') as marca,
    COALESCE(cv.modelo, 'No especificado') as modelo,
    COALESCE(cv.placa, 'Sin placa') as placa,
    COALESCE(cv.color, 'No especificado') as color,
    'custodio_vehiculo'::text as tipo_custodio,
    CASE 
      WHEN cv.id IS NOT NULL THEN 'custodios_vehiculos'
      ELSE 'none'
    END as fuente
  FROM public.custodios_operativos co
  LEFT JOIN public.custodios_vehiculos cv 
    ON cv.custodio_id = co.id 
    AND cv.es_principal = true
    AND cv.estado = 'activo'
  WHERE co.nombre = p_custodio_nombre
    AND co.estado = 'activo'
  LIMIT 1;
END;
$$;

-- FASE 2: Crear función de migración individual desde servicios_custodia
CREATE OR REPLACE FUNCTION public.migrate_vehicle_from_servicios_custodia(p_custodio_nombre text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_custodio_id uuid;
  v_auto text;
  v_marca text;
  v_modelo text;
  v_placa text;
  v_vehicle_id uuid;
  v_existing_vehicle_count int;
  v_space_pos int;
BEGIN
  -- 1. Obtener el ID del custodio
  SELECT id INTO v_custodio_id
  FROM custodios_operativos
  WHERE nombre = p_custodio_nombre
    AND estado = 'activo'
  LIMIT 1;
  
  IF v_custodio_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Custodio no encontrado en custodios_operativos',
      'custodio_nombre', p_custodio_nombre
    );
  END IF;
  
  -- 2. Verificar si ya tiene vehículo registrado
  SELECT COUNT(*) INTO v_existing_vehicle_count
  FROM custodios_vehiculos
  WHERE custodio_id = v_custodio_id
    AND estado = 'activo';
    
  IF v_existing_vehicle_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Custodio ya tiene vehículo registrado',
      'vehicle_count', v_existing_vehicle_count
    );
  END IF;
  
  -- 3. Obtener datos del último servicio
  SELECT 
    sc.auto,
    sc.placa
  INTO v_auto, v_placa
  FROM servicios_custodia sc
  WHERE sc.nombre_custodio = p_custodio_nombre
    AND sc.auto IS NOT NULL
    AND sc.auto != ''
    AND sc.auto != 'undefined undefined'
    AND sc.auto != 'No especificado'
  ORDER BY sc.fecha_hora_cita DESC
  LIMIT 1;
  
  IF v_auto IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontraron datos de vehículo en servicios_custodia',
      'custodio_nombre', p_custodio_nombre
    );
  END IF;
  
  -- 4. Parsear marca y modelo del campo "auto"
  v_space_pos := position(' ' in v_auto);
  
  IF v_space_pos > 0 THEN
    v_marca := substring(v_auto from 1 for v_space_pos - 1);
    v_modelo := substring(v_auto from v_space_pos + 1);
  ELSE
    v_marca := v_auto;
    v_modelo := 'No especificado';
  END IF;
  
  -- 5. Insertar vehículo
  INSERT INTO custodios_vehiculos (
    custodio_id,
    marca,
    modelo,
    placa,
    es_principal,
    estado,
    observaciones
  ) VALUES (
    v_custodio_id,
    COALESCE(NULLIF(trim(v_marca), ''), 'No especificado'),
    COALESCE(NULLIF(trim(v_modelo), ''), 'No especificado'),
    COALESCE(NULLIF(trim(v_placa), ''), 'Sin placa'),
    true,
    'activo',
    'Migrado automáticamente desde servicios_custodia el ' || now()::date
  )
  RETURNING id INTO v_vehicle_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vehículo migrado exitosamente',
    'vehicle_id', v_vehicle_id,
    'custodio_id', v_custodio_id,
    'custodio_nombre', p_custodio_nombre,
    'marca', v_marca,
    'modelo', v_modelo,
    'placa', COALESCE(v_placa, 'Sin placa')
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error en migración: ' || SQLERRM,
      'custodio_nombre', p_custodio_nombre
    );
END;
$$;

-- FASE 5: Insertar vehículo para Hugo Alarcón
INSERT INTO custodios_vehiculos (
  custodio_id,
  marca,
  modelo,
  placa,
  color,
  es_principal,
  estado,
  observaciones
)
SELECT 
  id as custodio_id,
  'NISSAN' as marca,
  'VERSA' as modelo,
  'ABC-123' as placa,
  'Blanco' as color,
  true as es_principal,
  'activo' as estado,
  'Registrado manualmente para prueba de sistema' as observaciones
FROM custodios_operativos
WHERE nombre = 'HUGO IRAD ALARCON PADILLA'
  AND estado = 'activo'
  AND NOT EXISTS (
    SELECT 1 FROM custodios_vehiculos cv 
    WHERE cv.custodio_id = custodios_operativos.id
  )
LIMIT 1;