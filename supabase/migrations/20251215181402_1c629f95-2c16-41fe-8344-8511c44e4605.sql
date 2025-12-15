-- ============================================
-- Modificar liberar_custodio_a_planeacion para auto-generar invitación
-- y retornar datos necesarios para enviar email
-- ============================================

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
  v_new_custodio_operativo_id UUID;
  v_warnings JSONB := '[]'::jsonb;
  v_fases_incompletas TEXT[] := ARRAY[]::TEXT[];
  v_invitation_token TEXT;
BEGIN
  -- 1. Obtener datos de liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de liberación no encontrado: %', p_liberacion_id;
  END IF;
  
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RAISE EXCEPTION 'Este custodio ya fue liberado anteriormente';
  END IF;
  
  -- 2. Obtener datos del candidato
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidato no encontrado: %', v_liberacion.candidato_id;
  END IF;
  
  -- 3. Validar requisitos (solo si no se fuerza)
  IF NOT p_forzar_liberacion THEN
    -- Verificar feature flags y requisitos
    IF EXISTS (
      SELECT 1 FROM supply_feature_flags 
      WHERE flag_key = 'REQUIRE_DOCUMENTS_VALIDATED' AND flag_value = true
    ) THEN
      IF NOT v_liberacion.documentacion_completa THEN
        v_fases_incompletas := array_append(v_fases_incompletas, 'documentacion');
        v_warnings := v_warnings || jsonb_build_array('Documentación incompleta');
      END IF;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM supply_feature_flags 
      WHERE flag_key = 'REQUIRE_TOXICOLOGY_NEGATIVE' AND flag_value = true
    ) THEN
      IF NOT v_liberacion.toxicologicos_completado THEN
        v_fases_incompletas := array_append(v_fases_incompletas, 'toxicologicos');
        v_warnings := v_warnings || jsonb_build_array('Toxicológicos pendientes');
      END IF;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM supply_feature_flags 
      WHERE flag_key = 'REQUIRE_INSTALLATION_VALIDATED' AND flag_value = true
    ) THEN
      IF NOT v_liberacion.instalacion_gps_completado THEN
        v_fases_incompletas := array_append(v_fases_incompletas, 'gps');
        v_warnings := v_warnings || jsonb_build_array('Instalación GPS pendiente');
      END IF;
    END IF;
    
    -- Si hay fases incompletas y no se fuerza, fallar
    IF array_length(v_fases_incompletas, 1) > 0 THEN
      RAISE EXCEPTION 'Fases incompletas: %. Use forzar_liberacion=true para continuar.', 
        array_to_string(v_fases_incompletas, ', ');
    END IF;
  ELSE
    -- Registrar warnings sin bloquear
    IF NOT v_liberacion.documentacion_completa THEN
      v_warnings := v_warnings || jsonb_build_array('Documentación incompleta (liberado con advertencia)');
    END IF;
    IF NOT v_liberacion.toxicologicos_completado THEN
      v_warnings := v_warnings || jsonb_build_array('Toxicológicos pendientes (liberado con advertencia)');
    END IF;
    IF NOT v_liberacion.instalacion_gps_completado THEN
      v_warnings := v_warnings || jsonb_build_array('GPS no instalado (liberado con advertencia)');
    END IF;
  END IF;
  
  -- ============================================
  -- SYNC 1: Insertar en pc_custodios
  -- ============================================
  INSERT INTO pc_custodios (
    nombre,
    tel,
    email,
    zona_base,
    estado
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    v_candidato.zona_preferida_id,
    'activo'
  )
  RETURNING id INTO v_new_pc_custodio_id;
  
  -- ============================================
  -- SYNC 2: Insertar en custodios_operativos
  -- ============================================
  INSERT INTO custodios_operativos (
    nombre,
    telefono,
    email,
    zona_base,
    estado,
    disponibilidad,
    fuente,
    pc_custodio_id
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    v_candidato.zona_preferida_id,
    'activo',
    'disponible',
    'interno',
    v_new_pc_custodio_id
  )
  ON CONFLICT (pc_custodio_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email,
    estado = 'activo',
    disponibilidad = 'disponible',
    updated_at = NOW()
  RETURNING id INTO v_new_custodio_operativo_id;
  
  -- Refrescar vista materializada
  REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;
  
  -- ============================================
  -- SYNC 3: Crear invitación automática para portal
  -- ============================================
  v_invitation_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO custodian_invitations (
    token,
    email,
    nombre,
    telefono,
    candidato_id,
    created_by,
    expires_at
  ) VALUES (
    v_invitation_token,
    v_candidato.email,
    v_candidato.nombre,
    v_candidato.telefono,
    v_liberacion.candidato_id,
    p_liberado_por,
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT DO NOTHING;
  
  -- ============================================
  -- SYNC 4: Actualizar estado de liberación
  -- ============================================
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = NOW(),
    pc_custodio_id = v_new_pc_custodio_id,
    updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- ============================================
  -- SYNC 5: Actualizar estado del candidato
  -- ============================================
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'activo',
    estado_detallado = 'liberado_planificacion',
    updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;
  
  -- Retornar resultado con datos para envío de email
  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_new_pc_custodio_id,
    'custodio_operativo_id', v_new_custodio_operativo_id,
    'candidato_id', v_liberacion.candidato_id,
    'candidato_nombre', v_candidato.nombre,
    'candidato_email', v_candidato.email,
    'candidato_telefono', v_candidato.telefono,
    'warnings', v_warnings,
    'fases_incompletas', to_jsonb(v_fases_incompletas),
    'tiene_warnings', jsonb_array_length(v_warnings) > 0,
    'mensaje', CASE 
      WHEN jsonb_array_length(v_warnings) > 0 
      THEN 'Custodio liberado con advertencias'
      ELSE 'Custodio liberado exitosamente'
    END,
    'invitation_token', v_invitation_token
  );
END;
$$;

-- Agregar comentario explicativo
COMMENT ON FUNCTION public.liberar_custodio_a_planeacion IS 
'Libera un custodio a Planificación, sincronizando pc_custodios, custodios_operativos, 
y generando automáticamente una invitación al portal. Retorna invitation_token para envío de email.';