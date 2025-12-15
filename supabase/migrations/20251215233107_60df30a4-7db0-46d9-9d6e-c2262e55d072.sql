-- Fix 1: Create unique index on pc_custodios.nombre for ON CONFLICT clause
CREATE UNIQUE INDEX IF NOT EXISTS pc_custodios_nombre_unique 
ON pc_custodios(nombre);

-- Fix 2: Recreate the liberar_custodio_a_planeacion function with corrected INSERT
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_liberado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liberacion RECORD;
  v_candidato RECORD;
  v_new_pc_custodio_id UUID;
  v_validation_errors TEXT[] := ARRAY[]::TEXT[];
  v_feature_flags RECORD;
  v_invitation_token TEXT;
BEGIN
  -- 1. Get liberacion record with candidate info
  SELECT cl.*, cc.nombre, cc.telefono, cc.email, cc.vehiculo_propio, cc.zona_preferida_id
  INTO v_liberacion
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cl.candidato_id = cc.id
  WHERE cl.id = p_liberacion_id;

  IF v_liberacion IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Liberación no encontrada'
    );
  END IF;

  -- Check if already liberated
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado anteriormente'
    );
  END IF;

  -- 2. Get feature flags (skip validation if forcing)
  IF NOT p_forzar_liberacion THEN
    SELECT 
      MAX(CASE WHEN flag_key = 'REQUIRE_INTERVIEW_RATING' THEN flag_value::boolean ELSE false END) as require_interview,
      MAX(CASE WHEN flag_key = 'REQUIRE_PSYCHOMETRIC_EVALUATION' THEN flag_value::boolean ELSE false END) as require_psychometric,
      MAX(CASE WHEN flag_key = 'REQUIRE_TOXICOLOGY_NEGATIVE' THEN flag_value::boolean ELSE false END) as require_toxicology,
      MAX(CASE WHEN flag_key = 'REQUIRE_REFERENCES_VALIDATION' THEN flag_value::boolean ELSE false END) as require_references,
      MAX(CASE WHEN flag_key = 'REQUIRE_DOCUMENTS_VALIDATED' THEN flag_value::boolean ELSE false END) as require_documents,
      MAX(CASE WHEN flag_key = 'REQUIRE_CONTRACTS_SIGNED' THEN flag_value::boolean ELSE false END) as require_contracts,
      MAX(CASE WHEN flag_key = 'REQUIRE_TRAINING_COMPLETED' THEN flag_value::boolean ELSE false END) as require_training,
      MAX(CASE WHEN flag_key = 'REQUIRE_INSTALLATION_VALIDATED' THEN flag_value::boolean ELSE false END) as require_installation
    INTO v_feature_flags
    FROM supply_feature_flags
    WHERE is_active = true;

    -- Validate required fields based on feature flags
    IF v_feature_flags.require_documents AND NOT COALESCE(v_liberacion.documentacion_completa, false) THEN
      v_validation_errors := array_append(v_validation_errors, 'Documentación incompleta');
    END IF;

    IF v_feature_flags.require_toxicology AND NOT COALESCE(v_liberacion.toxicologicos_completado, false) THEN
      v_validation_errors := array_append(v_validation_errors, 'Toxicológicos pendientes');
    END IF;

    IF v_feature_flags.require_installation AND NOT COALESCE(v_liberacion.instalacion_gps_completado, false) THEN
      v_validation_errors := array_append(v_validation_errors, 'Instalación GPS pendiente');
    END IF;

    -- Return validation errors if any
    IF array_length(v_validation_errors, 1) > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Validaciones pendientes',
        'validation_errors', to_jsonb(v_validation_errors)
      );
    END IF;
  END IF;

  -- 3. Create pc_custodio record
  INSERT INTO pc_custodios (
    nombre, tel, email, zona_base, vehiculo_propio,
    estado, disponibilidad, created_at, updated_at
  ) VALUES (
    v_liberacion.nombre,
    v_liberacion.telefono,
    v_liberacion.email,
    v_liberacion.zona_preferida_id::text,
    COALESCE(v_liberacion.vehiculo_propio, false),
    'activo',
    'disponible',
    NOW(),
    NOW()
  )
  ON CONFLICT (nombre) DO UPDATE SET
    estado = 'activo',
    disponibilidad = 'disponible',
    updated_at = NOW()
  RETURNING id INTO v_new_pc_custodio_id;

  -- 4. Also insert into custodios_operativos for operational queries (with pc_custodio_id)
  INSERT INTO custodios_operativos (
    nombre, telefono, email, zona_base, vehiculo_propio,
    estado, disponibilidad, fuente, created_at, updated_at,
    pc_custodio_id
  ) VALUES (
    v_liberacion.nombre,
    v_liberacion.telefono,
    v_liberacion.email,
    v_liberacion.zona_preferida_id::text,
    COALESCE(v_liberacion.vehiculo_propio, false),
    'activo',
    'disponible',
    'liberacion_supply',
    NOW(),
    NOW(),
    v_new_pc_custodio_id
  )
  ON CONFLICT (nombre) DO UPDATE SET
    estado = 'activo',
    disponibilidad = 'disponible',
    pc_custodio_id = EXCLUDED.pc_custodio_id,
    updated_at = NOW();

  -- 5. Update candidato estado
  UPDATE candidatos_custodios
  SET estado_proceso = 'activo',
      estado_detallado = 'liberado_planificacion',
      updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;

  -- 6. Generate invitation token
  v_invitation_token := encode(gen_random_bytes(32), 'hex');

  -- 7. Create invitation record
  INSERT INTO custodian_invitations (
    token, email, nombre, telefono, candidato_id, 
    expires_at, created_by
  ) VALUES (
    v_invitation_token,
    v_liberacion.email,
    v_liberacion.nombre,
    v_liberacion.telefono,
    v_liberacion.candidato_id,
    NOW() + INTERVAL '30 days',
    p_liberado_por
  )
  ON CONFLICT (email) DO UPDATE SET
    token = EXCLUDED.token,
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    expires_at = EXCLUDED.expires_at,
    used_at = NULL,
    used_by = NULL;

  -- 8. Update liberacion record
  UPDATE custodio_liberacion
  SET estado_liberacion = 'liberado',
      liberado_por = p_liberado_por,
      fecha_liberacion = NOW(),
      pc_custodio_id = v_new_pc_custodio_id,
      updated_at = NOW()
  WHERE id = p_liberacion_id;

  -- 9. Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;

  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_new_pc_custodio_id,
    'invitation_token', v_invitation_token,
    'custodio_nombre', v_liberacion.nombre,
    'custodio_email', v_liberacion.email,
    'custodio_telefono', v_liberacion.telefono,
    'message', 'Custodio liberado exitosamente a Planeación'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;