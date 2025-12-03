-- =====================================================
-- FIX: Bug de liberación - columnas faltantes y nombre incorrecto
-- =====================================================

-- Paso 1: Agregar columnas faltantes a pc_custodios para trazabilidad
ALTER TABLE pc_custodios 
ADD COLUMN IF NOT EXISTS candidato_origen_id uuid REFERENCES candidatos_custodios(id),
ADD COLUMN IF NOT EXISTS vehiculo_propio boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_alta timestamp with time zone DEFAULT now();

-- Crear índice para búsqueda por origen
CREATE INDEX IF NOT EXISTS idx_pc_custodios_candidato_origen 
ON pc_custodios(candidato_origen_id) WHERE candidato_origen_id IS NOT NULL;

-- Paso 2: Recrear función RPC con nombre de columna corregido (telefono → tel)
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
  v_pc_custodio_id uuid;
  v_warnings text[] := ARRAY[]::text[];
  v_feature_flags RECORD;
BEGIN
  -- Obtener datos de la liberación con información del candidato
  SELECT 
    cl.*,
    cc.nombre,
    cc.telefono,
    cc.email,
    cc.zona_preferida_id,
    cc.vehiculo_propio,
    cc.id as candidato_id
  INTO v_liberacion
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cl.candidato_id = cc.id
  WHERE cl.id = p_liberacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liberación no encontrada: %', p_liberacion_id;
  END IF;

  -- Verificar que no esté ya liberado
  IF v_liberacion.estado_liberacion = 'liberado' THEN
    RAISE EXCEPTION 'Este custodio ya fue liberado anteriormente';
  END IF;

  -- Obtener feature flags
  SELECT * INTO v_feature_flags FROM supply_feature_flags LIMIT 1;

  -- Verificaciones con feature flags (solo warnings si no se fuerza)
  IF NOT p_forzar_liberacion THEN
    -- Verificar documentación
    IF v_feature_flags.require_documents_validated AND NOT COALESCE(v_liberacion.documentacion_completa, false) THEN
      v_warnings := array_append(v_warnings, 'Documentación incompleta');
    END IF;

    -- Verificar toxicología
    IF v_feature_flags.require_toxicology_negative AND NOT COALESCE(v_liberacion.toxicologicos_completado, false) THEN
      v_warnings := array_append(v_warnings, 'Toxicología pendiente');
    END IF;

    -- Verificar GPS
    IF NOT COALESCE(v_liberacion.instalacion_gps_completado, false) THEN
      v_warnings := array_append(v_warnings, 'Instalación GPS pendiente');
    END IF;

    -- Si hay warnings críticos y no se fuerza, retornar sin liberar
    IF array_length(v_warnings, 1) > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'warnings', v_warnings,
        'message', 'Liberación bloqueada por validaciones pendientes'
      );
    END IF;
  END IF;

  -- Crear registro en pc_custodios (custodios operativos de planificación)
  INSERT INTO pc_custodios (
    nombre,
    tel,
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

  -- Actualizar estado de la liberación
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_liberado_por,
    fecha_liberacion = now(),
    pc_custodio_id = v_pc_custodio_id,
    updated_at = now()
  WHERE id = p_liberacion_id;

  -- Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'liberado',
    estado_detallado = 'liberado_planificacion',
    updated_at = now()
  WHERE id = v_liberacion.candidato_id;

  -- Registrar transición de estado
  INSERT INTO custodio_state_transitions (
    candidato_id,
    from_state,
    to_state,
    transitioned_by,
    notes
  ) VALUES (
    v_liberacion.candidato_id,
    v_liberacion.estado_liberacion,
    'liberado',
    p_liberado_por,
    'Liberado a planificación'
  );

  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_pc_custodio_id,
    'warnings', v_warnings,
    'message', 'Custodio liberado exitosamente a planificación'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error en liberación: %', SQLERRM;
END;
$$;