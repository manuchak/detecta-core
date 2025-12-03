-- Drop existing function and recreate with PostGIS-free implementation
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion(uuid, uuid, boolean);

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
  v_liberacion custodio_liberacion%ROWTYPE;
  v_candidato candidatos_custodios%ROWTYPE;
  v_nuevo_custodio_id uuid;
  v_warnings text[] := ARRAY[]::text[];
  v_lat double precision;
  v_lng double precision;
BEGIN
  -- Obtener la liberación
  SELECT * INTO v_liberacion
  FROM custodio_liberacion
  WHERE id = p_liberacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Liberación no encontrada'
    );
  END IF;

  -- Verificar que no esté ya liberado
  IF v_liberacion.estado = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado'
    );
  END IF;

  -- Obtener datos del candidato
  SELECT * INTO v_candidato
  FROM candidatos_custodios
  WHERE id = v_liberacion.candidato_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Candidato no encontrado'
    );
  END IF;

  -- Validaciones (solo si no se fuerza la liberación)
  IF NOT p_forzar_liberacion THEN
    IF NOT COALESCE(v_liberacion.documentacion_completa, false) THEN
      v_warnings := array_append(v_warnings, 'Documentación incompleta');
    END IF;
    
    IF NOT COALESCE(v_liberacion.toxicologico_aprobado, false) THEN
      v_warnings := array_append(v_warnings, 'Toxicológico no aprobado');
    END IF;
    
    IF NOT COALESCE(v_liberacion.gps_instalado, false) THEN
      v_warnings := array_append(v_warnings, 'GPS no instalado');
    END IF;

    -- Si hay warnings y no se fuerza, retornar con warnings
    IF array_length(v_warnings, 1) > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Validaciones pendientes',
        'warnings', v_warnings,
        'requires_force', true
      );
    END IF;
  END IF;

  -- Extraer coordenadas de forma segura (sin PostGIS)
  -- El tipo point de PostgreSQL se accede como array: [0] = x (lng), [1] = y (lat)
  IF v_candidato.ubicacion_residencia IS NOT NULL THEN
    v_lng := (v_candidato.ubicacion_residencia)[0];
    v_lat := (v_candidato.ubicacion_residencia)[1];
  ELSE
    v_lng := NULL;
    v_lat := NULL;
  END IF;

  -- Insertar en pc_custodios (personal de custodia operativo)
  INSERT INTO pc_custodios (
    nombre,
    telefono,
    email,
    estado,
    disponibilidad,
    zona_operacion,
    lat,
    lng,
    candidato_origen_id,
    fecha_alta,
    created_at,
    updated_at
  ) VALUES (
    v_candidato.nombre,
    v_candidato.telefono,
    v_candidato.email,
    'activo',
    'disponible',
    COALESCE(
      (SELECT nombre FROM zonas_operacion_nacional WHERE id = v_candidato.zona_preferida_id),
      'Sin zona asignada'
    ),
    v_lat,
    v_lng,
    v_candidato.id,
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_nuevo_custodio_id;

  -- Actualizar estado de la liberación
  UPDATE custodio_liberacion
  SET 
    estado = 'liberado',
    aprobado_por = p_liberado_por,
    fecha_aprobacion = now(),
    updated_at = now()
  WHERE id = p_liberacion_id;

  -- Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'liberado',
    estado_detallado = 'liberado_a_planeacion',
    updated_at = now()
  WHERE id = v_liberacion.candidato_id;

  RETURN jsonb_build_object(
    'success', true,
    'custodio_id', v_nuevo_custodio_id,
    'message', 'Custodio liberado exitosamente a Planeación',
    'warnings', v_warnings
  );
END;
$$;