-- =====================================================
-- FIX: Sincronización custodios_operativos + pc_custodios
-- Problema raíz: liberar_custodio_a_planeacion solo insertaba en pc_custodios
-- pero Planeación lee de custodios_operativos
-- =====================================================

-- PARTE 1: Liberar manualmente a JOSE JESUS OVANDO LOPEZ
-- Candidato ID: 3f9aaacb-7fe5-4d68-ac1d-850450640a55

-- 1.1 Insertar en custodios_operativos (donde Planeación busca)
INSERT INTO custodios_operativos (
  nombre, 
  telefono, 
  email, 
  zona_base, 
  vehiculo_propio, 
  estado, 
  disponibilidad, 
  fuente, 
  created_at,
  updated_at
)
SELECT 
  cc.nombre,
  cc.telefono,
  cc.email,
  cc.zona_preferida_id,
  COALESCE(cc.vehiculo_propio, false),
  'activo',
  'disponible',
  'liberacion_supply',
  NOW(),
  NOW()
FROM candidatos_custodios cc
WHERE cc.id = '3f9aaacb-7fe5-4d68-ac1d-850450640a55'
ON CONFLICT (nombre) DO UPDATE SET
  estado = 'activo',
  disponibilidad = 'disponible',
  updated_at = NOW();

-- 1.2 Actualizar liberación de OVANDO
UPDATE custodio_liberacion 
SET 
  estado_liberacion = 'liberado', 
  fecha_liberacion = NOW(),
  updated_at = NOW()
WHERE candidato_id = '3f9aaacb-7fe5-4d68-ac1d-850450640a55';

-- 1.3 Actualizar candidato OVANDO
UPDATE candidatos_custodios 
SET 
  estado_proceso = 'activo', 
  estado_detallado = 'liberado_planificacion',
  updated_at = NOW()
WHERE id = '3f9aaacb-7fe5-4d68-ac1d-850450640a55';

-- PARTE 2: Corregir función liberar_custodio_a_planeacion
-- Ahora sincroniza AMBAS tablas: pc_custodios + custodios_operativos

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
  v_liberacion RECORD;
  v_candidato RECORD;
  v_warnings jsonb := '[]'::jsonb;
  v_new_pc_custodio_id uuid;
  v_new_custodio_operativo_id uuid;
  v_require_psychometric boolean := false;
  v_require_toxicology boolean := false;
  v_require_references boolean := false;
  v_require_documents boolean := false;
  v_require_contracts boolean := false;
  v_require_training boolean := false;
  v_require_installation boolean := false;
BEGIN
  -- Get liberacion record
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registro de liberación no encontrado'
    );
  END IF;
  
  -- Check if already released
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El custodio ya fue liberado anteriormente'
    );
  END IF;
  
  -- Get candidato data
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidato no encontrado'
    );
  END IF;
  
  -- Read feature flags with CORRECT column names (flag_key, flag_value)
  SELECT COALESCE(flag_value, false) INTO v_require_psychometric
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_PSYCHOMETRIC_EVALUATION';
  
  SELECT COALESCE(flag_value, false) INTO v_require_toxicology
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_TOXICOLOGY_NEGATIVE';
  
  SELECT COALESCE(flag_value, false) INTO v_require_references
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_REFERENCES_VALIDATION';
  
  SELECT COALESCE(flag_value, false) INTO v_require_documents
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_DOCUMENTS_VALIDATED';
  
  SELECT COALESCE(flag_value, false) INTO v_require_contracts
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_CONTRACTS_SIGNED';
  
  SELECT COALESCE(flag_value, false) INTO v_require_training
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_TRAINING_COMPLETED';
  
  SELECT COALESCE(flag_value, false) INTO v_require_installation
  FROM supply_feature_flags WHERE flag_key = 'REQUIRE_INSTALLATION_VALIDATED';
  
  -- Collect warnings for incomplete validations
  IF NOT COALESCE(v_liberacion.documentacion_completa, false) THEN
    v_warnings := v_warnings || jsonb_build_object('tipo', 'documentacion', 'mensaje', 'Documentación incompleta');
  END IF;
  
  IF NOT COALESCE(v_liberacion.psicometricos_completado, false) THEN
    v_warnings := v_warnings || jsonb_build_object('tipo', 'psicometricos', 'mensaje', 'Evaluación psicométrica pendiente');
  END IF;
  
  IF NOT COALESCE(v_liberacion.toxicologicos_completado, false) THEN
    v_warnings := v_warnings || jsonb_build_object('tipo', 'toxicologicos', 'mensaje', 'Examen toxicológico pendiente');
  END IF;
  
  IF NOT COALESCE(v_liberacion.instalacion_gps_completado, false) THEN
    v_warnings := v_warnings || jsonb_build_object('tipo', 'gps', 'mensaje', 'Instalación GPS pendiente');
  END IF;
  
  -- If not forcing and there are blocking validations, return error
  IF NOT p_forzar_liberacion THEN
    IF v_require_psychometric AND NOT COALESCE(v_liberacion.psicometricos_completado, false) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Se requiere evaluación psicométrica completada',
        'warnings', v_warnings
      );
    END IF;
    
    IF v_require_toxicology AND NOT COALESCE(v_liberacion.toxicologicos_completado, false) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Se requiere examen toxicológico negativo',
        'warnings', v_warnings
      );
    END IF;
  END IF;
  
  -- ============================================
  -- SYNC 1: Insertar en pc_custodios (legacy)
  -- ============================================
  INSERT INTO pc_custodios (
    nombre,
    tel,
    email,
    zona_base,
    estado,
    created_at,
    updated_at
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    v_candidato.zona_preferida_id::text,
    'disponible',
    NOW(),
    NOW()
  )
  ON CONFLICT (nombre) DO UPDATE SET
    estado = 'disponible',
    updated_at = NOW()
  RETURNING id INTO v_new_pc_custodio_id;
  
  -- ============================================
  -- SYNC 2: Insertar en custodios_operativos (DONDE PLANEACIÓN LEE)
  -- ============================================
  INSERT INTO custodios_operativos (
    nombre,
    telefono,
    email,
    zona_base,
    vehiculo_propio,
    estado,
    disponibilidad,
    fuente,
    created_at,
    updated_at
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    v_candidato.zona_preferida_id,
    COALESCE(v_candidato.vehiculo_propio, false),
    'activo',
    'disponible',
    'liberacion_supply',
    NOW(),
    NOW()
  )
  ON CONFLICT (nombre) DO UPDATE SET
    estado = 'activo',
    disponibilidad = 'disponible',
    updated_at = NOW()
  RETURNING id INTO v_new_custodio_operativo_id;
  
  -- Update liberacion record
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    fecha_liberacion = NOW(),
    liberado_por = p_liberado_por,
    pc_custodio_id = v_new_pc_custodio_id,
    updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- Update candidato status
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'activo',
    estado_detallado = 'liberado_planificacion',
    updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;
  
  -- Log audit entry
  INSERT INTO lead_audit_log (
    lead_id,
    accion,
    usuario_id,
    detalles,
    created_at
  ) VALUES (
    v_liberacion.candidato_id,
    'liberacion_custodio',
    p_liberado_por,
    jsonb_build_object(
      'liberacion_id', p_liberacion_id,
      'pc_custodio_id', v_new_pc_custodio_id,
      'custodio_operativo_id', v_new_custodio_operativo_id,
      'forzado', p_forzar_liberacion,
      'warnings', v_warnings,
      'sync_tables', ARRAY['pc_custodios', 'custodios_operativos']
    ),
    NOW()
  );
  
  -- Refrescar vista materializada para que Planeación vea el nuevo custodio
  REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;
  
  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_new_pc_custodio_id,
    'custodio_operativo_id', v_new_custodio_operativo_id,
    'warnings', v_warnings,
    'mensaje', 'Custodio liberado exitosamente a Planificación (sincronizado en ambas tablas)'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- PARTE 3: Refrescar vista materializada
REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;

-- Add comment
COMMENT ON FUNCTION public.liberar_custodio_a_planeacion(UUID, UUID, BOOLEAN) IS 
'Libera un custodio a Planificación sincronizando AMBAS tablas: pc_custodios (legacy) y custodios_operativos (donde Planeación lee). Incluye refresh de vista materializada para visibilidad inmediata.';