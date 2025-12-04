-- Fix: Cambiar estado_proceso='liberado' por estado_proceso='activo' 
-- para cumplir con la restricción CHECK de candidatos_custodios

CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id uuid,
  p_liberado_por uuid,
  p_forzar_liberacion boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_candidato_id uuid;
  v_candidato_nombre text;
  v_candidato_telefono text;
  v_candidato_email text;
  v_zona_preferida_id uuid;
  v_vehiculo_propio boolean;
  v_liberacion record;
  v_warnings text[] := ARRAY[]::text[];
  v_new_pc_custodio_id uuid;
  v_feature_flags record;
BEGIN
  -- Obtener datos de la liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registro de liberación no encontrado'
    );
  END IF;

  -- Verificar que no esté ya liberado
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado anteriormente'
    );
  END IF;

  -- Obtener datos del candidato
  SELECT 
    id, nombre, telefono, email, zona_preferida_id, vehiculo_propio
  INTO 
    v_candidato_id, v_candidato_nombre, v_candidato_telefono, 
    v_candidato_email, v_zona_preferida_id, v_vehiculo_propio
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidato no encontrado'
    );
  END IF;

  -- Obtener feature flags para validaciones opcionales
  SELECT * INTO v_feature_flags FROM (
    SELECT 
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_PSYCHOMETRIC_EVALUATION'), false) as require_psychometric,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_TOXICOLOGY_NEGATIVE'), false) as require_toxicology,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_REFERENCES_VALIDATION'), false) as require_references,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_DOCUMENTS_VALIDATED'), false) as require_documents,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_CONTRACTS_SIGNED'), false) as require_contracts,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_TRAINING_COMPLETED'), false) as require_training,
      COALESCE((SELECT valor::boolean FROM supply_feature_flags WHERE flag_name = 'REQUIRE_INSTALLATION_VALIDATED'), false) as require_installation
  ) flags;

  -- Validaciones con warnings (no bloquean si p_forzar_liberacion = true)
  IF NOT v_liberacion.documentacion_completa THEN
    v_warnings := array_append(v_warnings, 'Documentación incompleta');
  END IF;

  IF NOT v_liberacion.toxicologicos_completado THEN
    v_warnings := array_append(v_warnings, 'Toxicológicos pendientes');
  END IF;

  IF NOT v_liberacion.instalacion_gps_completado THEN
    v_warnings := array_append(v_warnings, 'Instalación GPS pendiente');
  END IF;

  -- Si hay warnings y no se fuerza la liberación, retornar error
  IF array_length(v_warnings, 1) > 0 AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Validaciones pendientes',
      'warnings', v_warnings,
      'can_force', true
    );
  END IF;

  -- Crear registro en pc_custodios (Planning)
  INSERT INTO pc_custodios (
    nombre,
    telefono,
    email,
    zona_id,
    vehiculo_propio,
    estado,
    activo,
    fecha_ingreso,
    created_at,
    updated_at
  ) VALUES (
    v_candidato_nombre,
    v_candidato_telefono,
    v_candidato_email,
    v_zona_preferida_id,
    COALESCE(v_vehiculo_propio, false),
    'disponible',
    true,
    CURRENT_DATE,
    now(),
    now()
  )
  RETURNING id INTO v_new_pc_custodio_id;

  -- Actualizar registro de liberación
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = now(),
    pc_custodio_id = v_new_pc_custodio_id,
    updated_at = now()
  WHERE id = p_liberacion_id;

  -- Actualizar estado del candidato - CORREGIDO: usar 'activo' en lugar de 'liberado'
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'activo',
    estado_detallado = 'liberado_planificacion',
    updated_at = now()
  WHERE id = v_candidato_id;

  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_new_pc_custodio_id,
    'candidato_nombre', v_candidato_nombre,
    'warnings', v_warnings,
    'message', 'Custodio liberado exitosamente a Planificación'
  );
END;
$$;