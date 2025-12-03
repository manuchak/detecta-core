-- Corregir función liberar_custodio_a_planeacion con nombres de columna correctos
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id uuid,
  p_liberado_por uuid,
  p_forzar_liberacion boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liberacion RECORD;
  v_candidato RECORD;
  v_pc_custodio_id uuid;
  v_warnings text[] := ARRAY[]::text[];
  v_fases_incompletas text[] := ARRAY[]::text[];
  v_flag_psicometricos boolean := false;
  v_flag_toxicologia boolean := false;
  v_flag_referencias boolean := false;
BEGIN
  -- Obtener registro de liberación con candidato
  SELECT cl.*, cc.nombre, cc.telefono, cc.email, cc.zona_preferida_id, cc.vehiculo_propio
  INTO v_liberacion
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
  WHERE cl.id = p_liberacion_id;
  
  IF v_liberacion IS NULL THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado: %', p_liberacion_id;
  END IF;
  
  -- Verificar si ya está liberado (CORREGIDO: estado_liberacion en lugar de estado)
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RAISE EXCEPTION 'Este custodio ya ha sido liberado';
  END IF;
  
  -- Obtener feature flags
  SELECT COALESCE(flag_value, false) INTO v_flag_psicometricos
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_PSYCHOMETRIC_EVALUATION';
  
  SELECT COALESCE(flag_value, false) INTO v_flag_toxicologia
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_TOXICOLOGY_NEGATIVE';
  
  SELECT COALESCE(flag_value, false) INTO v_flag_referencias
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_REFERENCES_VALIDATION';
  
  -- Validar documentación
  IF NOT COALESCE(v_liberacion.documentacion_completa, false) THEN
    v_warnings := array_append(v_warnings, 'Documentación incompleta');
    v_fases_incompletas := array_append(v_fases_incompletas, 'documentacion');
  END IF;
  
  -- Validar toxicológicos (CORREGIDO: toxicologicos_completado en lugar de toxicologico_aprobado)
  IF NOT COALESCE(v_liberacion.toxicologicos_completado, false) THEN
    v_warnings := array_append(v_warnings, 'Toxicológicos no completados');
    v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologicos');
  END IF;
  
  -- Validar GPS (CORREGIDO: instalacion_gps_completado en lugar de gps_instalado)
  IF NOT COALESCE(v_liberacion.instalacion_gps_completado, false) THEN
    v_warnings := array_append(v_warnings, 'GPS no instalado');
    v_fases_incompletas := array_append(v_fases_incompletas, 'gps');
  END IF;
  
  -- Validar vehículo si aplica
  IF COALESCE(v_liberacion.vehiculo_propio, false) THEN
    IF NOT COALESCE(v_liberacion.vehiculo_capturado, false) THEN
      v_warnings := array_append(v_warnings, 'Información de vehículo no capturada');
      v_fases_incompletas := array_append(v_fases_incompletas, 'vehiculo');
    END IF;
  END IF;
  
  -- Verificar psicométricos si flag activo
  IF v_flag_psicometricos THEN
    IF NOT EXISTS (
      SELECT 1 FROM evaluaciones_psicometricas 
      WHERE candidato_id = v_liberacion.candidato_id
      AND (resultado_semaforo = 'verde' OR (resultado_semaforo = 'ambar' AND aval_decision = 'aprobado'))
    ) THEN
      v_warnings := array_append(v_warnings, 'Evaluación psicométrica no aprobada');
      v_fases_incompletas := array_append(v_fases_incompletas, 'psicometricos');
    END IF;
  END IF;
  
  -- Verificar toxicología en tabla de evaluaciones si flag activo
  IF v_flag_toxicologia THEN
    IF NOT EXISTS (
      SELECT 1 FROM evaluaciones_toxicologicas 
      WHERE candidato_id = v_liberacion.candidato_id
      AND resultado = 'negativo'
    ) THEN
      v_warnings := array_append(v_warnings, 'Toxicología no negativa en evaluaciones');
      v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologia_eval');
    END IF;
  END IF;
  
  -- Verificar referencias si flag activo
  IF v_flag_referencias THEN
    IF (
      SELECT COUNT(*) FROM referencias_candidato 
      WHERE candidato_id = v_liberacion.candidato_id
      AND resultado = 'positiva'
    ) < 4 THEN
      v_warnings := array_append(v_warnings, 'Referencias insuficientes (mínimo 4 positivas)');
      v_fases_incompletas := array_append(v_fases_incompletas, 'referencias');
    END IF;
  END IF;
  
  -- Si no se fuerza y hay warnings críticos, bloquear
  IF NOT p_forzar_liberacion AND array_length(v_fases_incompletas, 1) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'pc_custodio_id', null,
      'candidato_id', v_liberacion.candidato_id,
      'warnings', v_warnings,
      'fases_incompletas', v_fases_incompletas,
      'tiene_warnings', true,
      'mensaje', 'Liberación bloqueada: ' || array_to_string(v_warnings, ', ')
    );
  END IF;
  
  -- Crear registro en pc_custodios (tabla de Planificación)
  INSERT INTO pc_custodios (
    nombre,
    telefono,
    email,
    estado,
    disponibilidad,
    zona_base,
    vehiculo_propio,
    candidato_origen_id,
    fecha_alta,
    created_at,
    updated_at
  )
  SELECT
    v_liberacion.nombre,
    v_liberacion.telefono,
    v_liberacion.email,
    'activo',
    'disponible',
    (SELECT nombre FROM zonas_operacion_nacional WHERE id = v_liberacion.zona_preferida_id),
    COALESCE(v_liberacion.vehiculo_propio, false),
    v_liberacion.candidato_id,
    now(),
    now(),
    now()
  RETURNING id INTO v_pc_custodio_id;
  
  -- Actualizar estado de liberación (CORREGIDO: nombres de columna correctos)
  UPDATE custodio_liberacion SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = now(),
    updated_at = now()
  WHERE id = p_liberacion_id;
  
  -- Actualizar estado del candidato
  UPDATE candidatos_custodios SET
    estado_proceso = 'liberado',
    estado_detallado = 'liberado_a_planeacion',
    updated_at = now()
  WHERE id = v_liberacion.candidato_id;
  
  -- Registrar transición de estado
  INSERT INTO custodio_state_transitions (
    candidato_id,
    from_state,
    to_state,
    transition_reason,
    performed_by
  ) VALUES (
    v_liberacion.candidato_id,
    'en_liberacion',
    'liberado_a_planeacion',
    'Custodio liberado a planificación',
    p_liberado_por
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_pc_custodio_id,
    'candidato_id', v_liberacion.candidato_id,
    'warnings', v_warnings,
    'fases_incompletas', v_fases_incompletas,
    'tiene_warnings', array_length(v_warnings, 1) > 0,
    'mensaje', CASE 
      WHEN array_length(v_warnings, 1) > 0 
      THEN 'Custodio liberado con advertencias: ' || array_to_string(v_warnings, ', ')
      ELSE 'Custodio liberado exitosamente'
    END
  );
END;
$$;