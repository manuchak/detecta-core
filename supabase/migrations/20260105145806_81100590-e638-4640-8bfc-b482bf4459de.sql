-- Fix gen_random_bytes not found error by adding 'extensions' to search_path
-- The function is part of pgcrypto extension installed in the extensions schema

CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_forzar BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_liberacion RECORD;
  v_candidato RECORD;
  v_existing_pc_id UUID;
  v_existing_co_id UUID;
  v_new_pc_custodio_id UUID;
  v_custodio_operativo_id UUID;
  v_invitation_token TEXT;
  v_zona_nombre TEXT;
  v_email_sent BOOLEAN := FALSE;
  v_normalized_name TEXT;
BEGIN
  -- 1. Obtener datos de liberación con candidato
  SELECT cl.*, cc.nombre, cc.telefono, cc.email, cc.zona_preferida_id,
         cc.vehiculo_propio, cc.experiencia_seguridad, cc.disponibilidad_horarios
  INTO v_liberacion
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cl.candidato_id = cc.id
  WHERE cl.id = p_liberacion_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Liberación no encontrada'
    );
  END IF;
  
  -- Verificar si ya está liberado (a menos que se fuerce)
  IF v_liberacion.estado_liberacion = 'liberado' AND NOT p_forzar THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El custodio ya ha sido liberado',
      'pc_custodio_id', v_liberacion.pc_custodio_id
    );
  END IF;
  
  -- 2. Normalizar nombre para búsquedas consistentes
  v_normalized_name := public.normalize_name(v_liberacion.nombre);
  
  -- 3. Obtener nombre de zona
  SELECT nombre INTO v_zona_nombre
  FROM zonas_operacion_nacional
  WHERE id = v_liberacion.zona_preferida_id;
  
  -- 4. Buscar si ya existe en pc_custodios (por nombre normalizado)
  SELECT id INTO v_existing_pc_id
  FROM pc_custodios
  WHERE public.normalize_name(nombre) = v_normalized_name;
  
  -- 5. Crear o actualizar en pc_custodios
  IF v_existing_pc_id IS NOT NULL THEN
    -- Actualizar registro existente
    UPDATE pc_custodios
    SET estado = 'activo',
        disponibilidad = 'disponible',
        tel = COALESCE(v_liberacion.telefono, tel),
        email = COALESCE(v_liberacion.email, email),
        zona_base = COALESCE(v_zona_nombre, zona_base),
        vehiculo_propio = COALESCE(v_liberacion.vehiculo_propio, vehiculo_propio),
        updated_at = NOW()
    WHERE id = v_existing_pc_id;
    
    v_new_pc_custodio_id := v_existing_pc_id;
  ELSE
    -- Insertar nuevo registro
    INSERT INTO pc_custodios (
      nombre, tel, email, zona_base, vehiculo_propio, estado, disponibilidad
    ) VALUES (
      v_liberacion.nombre,
      v_liberacion.telefono,
      v_liberacion.email,
      v_zona_nombre,
      COALESCE(v_liberacion.vehiculo_propio, false),
      'activo',
      'disponible'
    )
    RETURNING id INTO v_new_pc_custodio_id;
  END IF;
  
  -- VALIDACIÓN CRÍTICA: Asegurar que se creó/encontró el pc_custodio
  IF v_new_pc_custodio_id IS NULL THEN
    RAISE EXCEPTION 'Error crítico: No se pudo crear/encontrar registro en pc_custodios para %', v_liberacion.nombre;
  END IF;
  
  -- 6. Buscar si ya existe en custodios_operativos (por nombre normalizado)
  SELECT id INTO v_existing_co_id
  FROM custodios_operativos
  WHERE public.normalize_name(nombre) = v_normalized_name;
  
  -- 7. Crear o actualizar en custodios_operativos
  IF v_existing_co_id IS NOT NULL THEN
    -- Actualizar registro existente y vincular con pc_custodio
    UPDATE custodios_operativos
    SET pc_custodio_id = v_new_pc_custodio_id,
        estado = 'activo',
        disponibilidad = 'disponible',
        telefono = COALESCE(v_liberacion.telefono, telefono),
        email = COALESCE(v_liberacion.email, email),
        zona_base = COALESCE(v_zona_nombre, zona_base),
        vehiculo_propio = COALESCE(v_liberacion.vehiculo_propio, vehiculo_propio),
        updated_at = NOW()
    WHERE id = v_existing_co_id;
    
    v_custodio_operativo_id := v_existing_co_id;
  ELSE
    -- Insertar nuevo registro
    INSERT INTO custodios_operativos (
      nombre, telefono, email, zona_base, vehiculo_propio,
      estado, disponibilidad, pc_custodio_id, experiencia_anos,
      tiene_vehiculo, rating_promedio, numero_servicios
    ) VALUES (
      v_liberacion.nombre,
      v_liberacion.telefono,
      v_liberacion.email,
      v_zona_nombre,
      COALESCE(v_liberacion.vehiculo_propio, false),
      'activo',
      'disponible',
      v_new_pc_custodio_id,
      CASE WHEN v_liberacion.experiencia_seguridad THEN 1 ELSE 0 END,
      COALESCE(v_liberacion.vehiculo_propio, false),
      5.0,
      0
    )
    RETURNING id INTO v_custodio_operativo_id;
  END IF;
  
  -- VALIDACIÓN CRÍTICA: Asegurar que se creó/encontró el custodio_operativo
  IF v_custodio_operativo_id IS NULL THEN
    RAISE EXCEPTION 'Error crítico: No se pudo crear/encontrar registro en custodios_operativos para %', v_liberacion.nombre;
  END IF;
  
  -- 8. Generar token de invitación
  v_invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- 9. Actualizar custodio_liberacion
  UPDATE custodio_liberacion
  SET estado_liberacion = 'liberado',
      pc_custodio_id = v_new_pc_custodio_id,
      fecha_liberacion = NOW(),
      invitation_token = v_invitation_token,
      invitation_expires_at = NOW() + INTERVAL '7 days',
      updated_at = NOW()
  WHERE id = p_liberacion_id;
  
  -- 10. Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET estado_proceso = 'liberado',
      estado_detallado = 'Liberado a Planeación',
      updated_at = NOW()
  WHERE id = v_liberacion.candidato_id;
  
  -- 11. Refrescar vista materializada si existe
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar si la vista no existe o hay error
    NULL;
  END;
  
  -- 12. Retornar resultado exitoso
  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_new_pc_custodio_id,
    'custodio_operativo_id', v_custodio_operativo_id,
    'invitation_token', v_invitation_token,
    'email_sent', v_email_sent,
    'candidato_nombre', v_liberacion.nombre,
    'candidato_email', v_liberacion.email,
    'candidato_telefono', v_liberacion.telefono,
    'sync_status', jsonb_build_object(
      'pc_custodios_updated', v_existing_pc_id IS NOT NULL,
      'pc_custodios_created', v_existing_pc_id IS NULL,
      'custodios_operativos_updated', v_existing_co_id IS NOT NULL,
      'custodios_operativos_created', v_existing_co_id IS NULL,
      'nombre_normalizado', v_normalized_name
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  -- En caso de cualquier error, la transacción se revierte automáticamente
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;