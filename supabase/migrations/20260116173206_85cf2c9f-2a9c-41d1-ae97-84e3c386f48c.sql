-- Corregir función liberar_custodio_a_planeacion
-- Problema: La versión actual referencia tabla incorrecta y no sincroniza pc_custodio_id antes del UPDATE

DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion(uuid, uuid, boolean);

CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_custodio_liberacion_id uuid,
  p_aprobado_por uuid,
  p_forzar_liberacion boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidato_id uuid;
  v_candidato_nombre text;
  v_candidato_telefono text;
  v_candidato_email text;
  v_pc_custodio_id uuid;
  v_custodio_operativo_id uuid;
  v_estado_actual text;
  v_vehiculo_info jsonb;
  v_result jsonb;
BEGIN
  -- 1. Obtener información del candidato desde custodio_liberacion (tabla correcta)
  SELECT 
    cl.candidato_id,
    cl.estado_liberacion,
    cc.nombre,
    cc.telefono,
    cc.email
  INTO 
    v_candidato_id,
    v_estado_actual,
    v_candidato_nombre,
    v_candidato_telefono,
    v_candidato_email
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
  WHERE cl.id = p_custodio_liberacion_id;

  IF v_candidato_id IS NULL THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado: %', p_custodio_liberacion_id;
  END IF;

  -- 2. Verificar estado (permitir re-liberación si se fuerza)
  IF v_estado_actual = 'liberado' AND NOT p_forzar_liberacion THEN
    RAISE EXCEPTION 'Este custodio ya fue liberado anteriormente';
  END IF;

  -- 3. Buscar o crear registro en pc_custodios PRIMERO (antes del UPDATE)
  SELECT id INTO v_pc_custodio_id
  FROM pc_custodios
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_pc_custodio_id IS NULL THEN
    -- Obtener info del vehículo si existe
    SELECT jsonb_build_object(
      'marca', vh.marca_nombre,
      'modelo', vh.modelo_nombre,
      'placa', vh.placa,
      'color', vh.color
    ) INTO v_vehiculo_info
    FROM vehiculos_candidatos vh
    WHERE vh.candidato_id = v_candidato_id
    LIMIT 1;

    -- Crear nuevo registro en pc_custodios
    INSERT INTO pc_custodios (
      nombre,
      telefono,
      email,
      estado,
      activo,
      disponibilidad,
      fecha_alta,
      created_at,
      updated_at,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_placa,
      vehiculo_color
    ) VALUES (
      v_candidato_nombre,
      v_candidato_telefono,
      v_candidato_email,
      'activo',
      true,
      'disponible',
      NOW(),
      NOW(),
      NOW(),
      v_vehiculo_info->>'marca',
      v_vehiculo_info->>'modelo',
      v_vehiculo_info->>'placa',
      v_vehiculo_info->>'color'
    )
    RETURNING id INTO v_pc_custodio_id;
  END IF;

  -- 4. Buscar o crear registro en custodios_operativos
  SELECT id INTO v_custodio_operativo_id
  FROM custodios_operativos
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_custodio_operativo_id IS NULL THEN
    INSERT INTO custodios_operativos (
      nombre,
      telefono,
      email,
      estado,
      disponibilidad,
      activo,
      created_at,
      updated_at
    ) VALUES (
      v_candidato_nombre,
      v_candidato_telefono,
      v_candidato_email,
      'activo',
      'disponible',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_custodio_operativo_id;
  END IF;

  -- 5. AHORA actualizar custodio_liberacion con pc_custodio_id ANTES de cambiar estado
  UPDATE custodio_liberacion
  SET 
    pc_custodio_id = v_pc_custodio_id,
    custodio_operativo_id = v_custodio_operativo_id,
    estado_liberacion = 'liberado',
    fecha_liberacion = NOW(),
    aprobado_por = p_aprobado_por,
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 6. Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'liberado',
    estado_detallado = 'Liberado a Planeación',
    updated_at = NOW()
  WHERE id = v_candidato_id;

  -- 7. Construir resultado
  v_result := jsonb_build_object(
    'success', true,
    'custodio_liberacion_id', p_custodio_liberacion_id,
    'candidato_id', v_candidato_id,
    'pc_custodio_id', v_pc_custodio_id,
    'custodio_operativo_id', v_custodio_operativo_id,
    'nombre', v_candidato_nombre,
    'mensaje', 'Custodio liberado exitosamente a Planeación'
  );

  RETURN v_result;
END;
$$;