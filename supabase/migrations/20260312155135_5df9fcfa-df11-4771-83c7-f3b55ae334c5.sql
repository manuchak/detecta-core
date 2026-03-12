-- Fix: When liberating armados, insert into armados_operativos instead of custodios_operativos

DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean, text);

CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion_v2(
  p_custodio_liberacion_id UUID,
  p_aprobado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT true,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lib RECORD;
  v_cand RECORD;
  v_is_armado BOOLEAN := false;
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

  -- 2. Get liberacion record
  SELECT * INTO v_lib
  FROM custodio_liberacion
  WHERE id = p_custodio_liberacion_id;

  IF v_lib IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registro de liberación no encontrado (id: ' || p_custodio_liberacion_id || ')'
    );
  END IF;

  IF v_lib.estado_liberacion = 'liberado' AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado anteriormente'
    );
  END IF;

  -- 3. Get candidate data — dual-table lookup
  SELECT * INTO v_cand
  FROM candidatos_custodios
  WHERE id = v_lib.candidato_id;

  IF v_cand IS NULL THEN
    SELECT * INTO v_cand
    FROM candidatos_armados
    WHERE id = v_lib.candidato_id;

    IF v_cand IS NOT NULL THEN
      v_is_armado := true;
    END IF;
  END IF;

  IF v_cand IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidato no encontrado para este registro de liberación'
    );
  END IF;

  v_nombre_normalizado := TRIM(v_cand.nombre);

  -- 4. Check incomplete phases
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

  -- 5. Handle pc_custodios (always — shared personnel record)
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

  -- 6. Handle operative table — BIFURCATED by candidate type
  IF v_is_armado THEN
    -- 6a. Armados → armados_operativos (so they appear in planning as internal armed guards)
    SELECT id INTO v_existing_operativo
    FROM armados_operativos
    WHERE TRIM(nombre) = v_nombre_normalizado
       OR (v_cand.telefono IS NOT NULL AND telefono = v_cand.telefono)
    LIMIT 1;

    IF v_existing_operativo IS NOT NULL THEN
      v_operativo_id := v_existing_operativo.id;
      v_warnings := array_append(v_warnings,
        'Armado operativo existente vinculado por nombre/teléfono');
      UPDATE armados_operativos
      SET
        estado = 'activo',
        disponibilidad = 'disponible',
        tipo_armado = 'interno',
        fuente = 'supply',
        telefono = COALESCE(v_cand.telefono, telefono),
        email = COALESCE(v_cand.email, email),
        licencia_portacion = COALESCE(v_cand.licencia_portacion, licencia_portacion),
        fecha_vencimiento_licencia = v_cand.fecha_vencimiento_licencia,
        fecha_inactivacion = NULL,
        motivo_inactivacion = NULL,
        tipo_inactivacion = NULL,
        fecha_reactivacion_programada = NULL,
        updated_at = NOW()
      WHERE id = v_operativo_id;
    ELSE
      INSERT INTO armados_operativos (
        nombre, telefono, email, estado, disponibilidad,
        tipo_armado, fuente, zona_base,
        licencia_portacion, fecha_vencimiento_licencia
      )
      VALUES (
        v_nombre_normalizado, v_cand.telefono, v_cand.email,
        'activo', 'disponible',
        'interno', 'supply',
        COALESCE((SELECT nombre FROM zonas_operacion_nacional WHERE id = v_cand.zona_preferida_id), 'Sin zona'),
        v_cand.licencia_portacion, v_cand.fecha_vencimiento_licencia
      )
      RETURNING id INTO v_operativo_id;
    END IF;

  ELSE
    -- 6b. Custodios → custodios_operativos (existing logic unchanged)
    SELECT id INTO v_existing_operativo
    FROM custodios_operativos
    WHERE pc_custodio_id = v_pc_custodio_id
    LIMIT 1;

    IF v_existing_operativo IS NULL THEN
      SELECT id INTO v_existing_operativo
      FROM custodios_operativos
      WHERE TRIM(nombre) = v_nombre_normalizado
         OR (v_cand.telefono IS NOT NULL AND telefono = v_cand.telefono)
      LIMIT 1;

      IF v_existing_operativo IS NOT NULL THEN
        v_warnings := array_append(v_warnings,
          'Operativo existente vinculado por nombre/teléfono (sin pc_custodio_id previo)');
      END IF;
    END IF;

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
        'activo', 'disponible',
        COALESCE(v_cand.vehiculo_propio, false),
        COALESCE((SELECT nombre FROM zonas_operacion_nacional WHERE id = v_cand.zona_preferida_id), 'Sin zona'),
        v_pc_custodio_id, 'supply'
      )
      RETURNING id INTO v_operativo_id;
    END IF;
  END IF;

  -- 7. Update liberacion record
  UPDATE custodio_liberacion
  SET
    estado_liberacion = 'liberado',
    fecha_liberacion = NOW(),
    liberado_por = p_aprobado_por,
    pc_custodio_id = v_pc_custodio_id,
    notas_liberacion = COALESCE(p_notas, notas_liberacion),
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 8. Update candidate status — correct table based on type
  IF v_is_armado THEN
    UPDATE candidatos_armados
    SET
      estado_proceso = 'liberado',
      estado_detallado = 'Liberado a planeación',
      updated_at = NOW()
    WHERE id = v_lib.candidato_id;
  ELSE
    UPDATE candidatos_custodios
    SET
      estado_proceso = 'liberado',
      estado_detallado = 'Liberado a planeación',
      updated_at = NOW()
    WHERE id = v_lib.candidato_id;
  END IF;

  -- 9. Create invitation token
  v_invitation_token := gen_random_uuid();

  INSERT INTO armado_invitations (
    token, nombre, email, telefono, status, expires_at, created_by
  )
  VALUES (
    v_invitation_token,
    v_nombre_normalizado,
    v_cand.email,
    v_cand.telefono,
    'pending',
    NOW() + INTERVAL '30 days',
    p_aprobado_por
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'custodio_operativo_id', v_operativo_id,
    'pc_custodio_id', v_pc_custodio_id,
    'invitation_token', v_invitation_token,
    'is_armado', v_is_armado,
    'warnings', to_jsonb(v_warnings)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean, text) TO authenticated;