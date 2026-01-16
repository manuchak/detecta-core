-- Corregir función - estado_proceso debe ser 'activo' (no 'liberado')

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
  v_vehiculo_propio boolean;
BEGIN
  -- 1. Obtener información del candidato
  SELECT 
    cl.candidato_id, cl.estado_liberacion,
    cc.nombre, cc.telefono, cc.email, cc.vehiculo_propio
  INTO 
    v_candidato_id, v_estado_actual,
    v_candidato_nombre, v_candidato_telefono, v_candidato_email, v_vehiculo_propio
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
  WHERE cl.id = p_custodio_liberacion_id;

  IF v_candidato_id IS NULL THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado: %', p_custodio_liberacion_id;
  END IF;

  IF v_estado_actual = 'liberado' AND NOT p_forzar_liberacion THEN
    RAISE EXCEPTION 'Este custodio ya fue liberado anteriormente';
  END IF;

  -- 2. Buscar o crear pc_custodios
  SELECT id INTO v_pc_custodio_id
  FROM pc_custodios
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_pc_custodio_id IS NULL THEN
    INSERT INTO pc_custodios (
      nombre, tel, email, estado, disponibilidad, 
      fecha_alta, vehiculo_propio, candidato_origen_id, created_at, updated_at
    ) VALUES (
      v_candidato_nombre, v_candidato_telefono, v_candidato_email,
      'activo', 'disponible', NOW(), COALESCE(v_vehiculo_propio, false),
      v_candidato_id, NOW(), NOW()
    )
    RETURNING id INTO v_pc_custodio_id;
  END IF;

  -- 3. Buscar o crear custodios_operativos
  SELECT id INTO v_custodio_operativo_id
  FROM custodios_operativos
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_custodio_operativo_id IS NULL THEN
    INSERT INTO custodios_operativos (
      nombre, telefono, email, estado, disponibilidad,
      vehiculo_propio, pc_custodio_id, created_at, updated_at
    ) VALUES (
      v_candidato_nombre, v_candidato_telefono, v_candidato_email,
      'activo', 'disponible', COALESCE(v_vehiculo_propio, false),
      v_pc_custodio_id, NOW(), NOW()
    )
    RETURNING id INTO v_custodio_operativo_id;
  ELSE
    UPDATE custodios_operativos
    SET pc_custodio_id = v_pc_custodio_id, updated_at = NOW()
    WHERE id = v_custodio_operativo_id AND pc_custodio_id IS NULL;
  END IF;

  -- 4. Actualizar custodio_liberacion
  UPDATE custodio_liberacion
  SET 
    pc_custodio_id = v_pc_custodio_id,
    estado_liberacion = 'liberado',
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 5. Actualizar candidato a estado 'activo' (valor válido del check constraint)
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'activo',
    estado_detallado = 'Liberado a Planeación',
    updated_at = NOW()
  WHERE id = v_candidato_id;

  -- 6. Resultado
  RETURN jsonb_build_object(
    'success', true,
    'custodio_liberacion_id', p_custodio_liberacion_id,
    'candidato_id', v_candidato_id,
    'pc_custodio_id', v_pc_custodio_id,
    'custodio_operativo_id', v_custodio_operativo_id,
    'nombre', v_candidato_nombre,
    'mensaje', 'Custodio liberado exitosamente a Planeación'
  );
END;
$$;