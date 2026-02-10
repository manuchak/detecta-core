
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion_v2(
  p_custodio_liberacion_id UUID,
  p_aprobado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lib RECORD;
  v_cand RECORD;
  v_nombre_normalizado TEXT;
  v_pc_custodio_id UUID;
  v_operativo_id UUID;
  v_existing_pc RECORD;
  v_existing_operativo RECORD;
  v_user_role TEXT;
  v_invitation_token UUID;
  v_warnings TEXT[] := '{}';
  v_fases_incompletas TEXT[] := '{}';
  v_result JSONB;
BEGIN
  -- 1. Validate approver role
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = p_aprobado_por
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuario no tiene rol asignado'
    );
  END IF;

  -- 2. Get liberacion record from custodio_liberacion (correct table name, without 's')
  SELECT * INTO v_lib
  FROM custodio_liberacion
  WHERE id = p_custodio_liberacion_id;

  IF v_lib IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registro de liberación no encontrado (id: ' || p_custodio_liberacion_id || ')'
    );
  END IF;

  -- Check if already released (unless forcing)
  IF v_lib.estado_liberacion = 'liberado' AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado anteriormente'
    );
  END IF;

  -- 3. Get candidate data from candidatos_custodios via JOIN
  SELECT * INTO v_cand
  FROM candidatos_custodios
  WHERE id = v_lib.candidato_id;

  IF v_cand IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidato no encontrado para este registro de liberación'
    );
  END IF;

  v_nombre_normalizado := TRIM(v_cand.nombre);

  -- 4. Check incomplete phases for warnings
  IF NOT COALESCE(v_lib.documentacion_completa, false) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'documentacion');
  END IF;
  IF NOT COALESCE(v_lib.toxicologicos_completado, false) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologicos');
  END IF;
  IF COALESCE(v_cand.vehiculo_propio, false) AND NOT COALESCE(v_lib.vehiculo_capturado, false) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'vehiculo');
  END IF;
  IF NOT COALESCE(v_lib.instalacion_gps_completado, false) THEN
    v_fases_incompletas := array_append(v_fases_incompletas, 'gps');
  END IF;

  IF array_length(v_fases_incompletas, 1) > 0 AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Hay fases incompletas. Use forzar_liberacion=true para continuar.',
      'fases_incompletas', to_jsonb(v_fases_incompletas)
    );
  END IF;

  IF array_length(v_fases_incompletas, 1) > 0 THEN
    v_warnings := array_append(v_warnings, 'Liberado con fases incompletas: ' || array_to_string(v_fases_incompletas, ', '));
  END IF;

  -- 5. Handle pc_custodios (check existing or create new)
  IF v_lib.pc_custodio_id IS NOT NULL THEN
    SELECT id INTO v_existing_pc
    FROM pc_custodios
    WHERE id = v_lib.pc_custodio_id;

    IF v_existing_pc IS NOT NULL THEN
      v_pc_custodio_id := v_existing_pc.id;
      UPDATE pc_custodios
      SET
        estado = 'activo',
        tel = COALESCE(v_cand.telefono, tel),
        email = COALESCE(v_cand.email, email),
        updated_at = NOW()
      WHERE id = v_pc_custodio_id;
    END IF;
  END IF;

  IF v_pc_custodio_id IS NULL THEN
    INSERT INTO pc_custodios (
      nombre, email, tel, estado, vehiculo_propio
    )
    VALUES (
      v_nombre_normalizado, v_cand.email, v_cand.telefono, 'activo', COALESCE(v_cand.vehiculo_propio, false)
    )
    RETURNING id INTO v_pc_custodio_id;
  END IF;

  -- 6. Handle custodios_operativos
  SELECT id INTO v_existing_operativo
  FROM custodios_operativos
  WHERE pc_custodio_id = v_pc_custodio_id
  LIMIT 1;

  IF v_existing_operativo IS NOT NULL THEN
    v_operativo_id := v_existing_operativo.id;
    UPDATE custodios_operativos
    SET
      estado = 'activo',
      disponibilidad = 'disponible',
      fuente = 'supply',
      pc_custodio_id = v_pc_custodio_id,
      telefono = COALESCE(v_cand.telefono, telefono),
      email = COALESCE(v_cand.email, email),
      fecha_inactivacion = NULL,
      motivo_inactivacion = NULL,
      tipo_inactivacion = NULL,
      fecha_reactivacion_programada = NULL,
      updated_at = NOW()
    WHERE id = v_operativo_id;
  ELSE
    INSERT INTO custodios_operativos (
      nombre, telefono, email, estado, disponibilidad,
      vehiculo_propio, zona_base, pc_custodio_id, fuente
    )
    VALUES (
      v_nombre_normalizado, v_cand.telefono, v_cand.email,
      'activo', 'disponible', COALESCE(v_cand.vehiculo_propio, false),
      (SELECT nombre FROM zonas_operacion_nacional WHERE id = v_cand.zona_preferida_id LIMIT 1),
      v_pc_custodio_id, 'supply'
    )
    RETURNING id INTO v_operativo_id;
  END IF;

  -- 7. Update custodio_liberacion with sync info (correct table name)
  UPDATE custodio_liberacion
  SET
    estado_liberacion = 'liberado',
    pc_custodio_id = v_pc_custodio_id,
    liberado_por = p_aprobado_por,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 8. Update candidato status
  UPDATE candidatos_custodios
  SET
    estado_proceso = 'liberado',
    updated_at = NOW()
  WHERE id = v_lib.candidato_id;

  -- 9. Generate invitation token
  v_invitation_token := gen_random_uuid();
  INSERT INTO custodian_invitations (
    token, email, nombre, telefono, candidato_id, created_by, expires_at
  )
  VALUES (
    v_invitation_token, v_cand.email, v_nombre_normalizado, v_cand.telefono,
    v_lib.candidato_id, p_aprobado_por, NOW() + INTERVAL '7 days'
  );

  -- 10. Build result aligned with frontend expectations
  v_result := jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_pc_custodio_id,
    'custodio_operativo_id', v_operativo_id,
    'candidato_id', v_lib.candidato_id,
    'candidato_nombre', v_nombre_normalizado,
    'candidato_email', v_cand.email,
    'candidato_telefono', v_cand.telefono,
    'warnings', to_jsonb(v_warnings),
    'fases_incompletas', to_jsonb(v_fases_incompletas),
    'tiene_warnings', (array_length(v_warnings, 1) > 0),
    'invitation_token', v_invitation_token,
    'mensaje', 'Custodio liberado exitosamente a planeación',
    'sync_status', jsonb_build_object(
      'pc_custodios_synced', true,
      'custodios_operativos_synced', true,
      'pc_custodios_was_existing', (v_existing_pc IS NOT NULL),
      'custodios_operativos_was_existing', (v_existing_operativo IS NOT NULL),
      'nombre_normalizado', v_nombre_normalizado
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;
