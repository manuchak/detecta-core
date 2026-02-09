
-- Drop both overloads to clean up
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean);

-- Recreate single version with 3 params and correct column name 'tel'
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion_v2(
  p_custodio_liberacion_id UUID,
  p_aprobado_por UUID,
  p_forzar_liberacion BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato_id UUID;
  v_candidato_nombre TEXT;
  v_candidato_email TEXT;
  v_candidato_telefono TEXT;
  v_zona_preferida_id UUID;
  v_vehiculo_propio BOOLEAN;
  v_estado_liberacion TEXT;
  v_pc_custodio_id UUID;
  v_custodio_operativo_id UUID;
  v_user_role TEXT;
  v_warnings TEXT[] := '{}';
  v_fases_incompletas TEXT[] := '{}';
  v_invitation_token TEXT;
  v_sync_status JSONB;
  v_pc_custodios_was_existing BOOLEAN := FALSE;
  v_custodios_operativos_was_existing BOOLEAN := FALSE;
  v_nombre_normalizado TEXT;
  v_direccion_residencia TEXT;
  v_estado_residencia_id UUID;
  v_ciudad_residencia TEXT;
  v_zona_base_nombre TEXT;
BEGIN
  -- 1. Validar rol del usuario
  SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_aprobado_por AND is_active = true LIMIT 1;
  
  IF v_user_role NOT IN ('admin', 'owner', 'supply_admin', 'supply_lead') THEN
    RETURN jsonb_build_object(
      'success', false,
      'mensaje', 'No tienes permisos para liberar custodios'
    );
  END IF;

  -- 2. Obtener datos del candidato y estado actual con residencia
  SELECT 
    cl.candidato_id,
    cc.nombre,
    cc.email,
    cc.telefono,
    cc.zona_preferida_id,
    cc.vehiculo_propio,
    cl.estado_liberacion,
    cl.direccion_residencia,
    cl.estado_residencia_id,
    cl.ciudad_residencia
  INTO 
    v_candidato_id,
    v_candidato_nombre,
    v_candidato_email,
    v_candidato_telefono,
    v_zona_preferida_id,
    v_vehiculo_propio,
    v_estado_liberacion,
    v_direccion_residencia,
    v_estado_residencia_id,
    v_ciudad_residencia
  FROM custodio_liberacion cl
  JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
  WHERE cl.id = p_custodio_liberacion_id;

  IF v_candidato_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'mensaje', 'Registro de liberación no encontrado'
    );
  END IF;

  v_nombre_normalizado := UPPER(TRIM(regexp_replace(v_candidato_nombre, '\s+', ' ', 'g')));

  IF v_estado_residencia_id IS NOT NULL THEN
    SELECT nombre INTO v_zona_base_nombre
    FROM estados
    WHERE id = v_estado_residencia_id;
  END IF;

  -- 3. Buscar o crear pc_custodios (FIX: usar 'tel' en vez de 'telefono')
  SELECT id INTO v_pc_custodio_id
  FROM pc_custodios
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_pc_custodio_id IS NULL THEN
    INSERT INTO pc_custodios (
      nombre, email, tel, estado, vehiculo_propio
    ) VALUES (
      v_nombre_normalizado, v_candidato_email, v_candidato_telefono, 'activo', COALESCE(v_vehiculo_propio, false)
    )
    RETURNING id INTO v_pc_custodio_id;
  ELSE
    v_pc_custodios_was_existing := TRUE;
    UPDATE pc_custodios
    SET 
      email = COALESCE(v_candidato_email, email),
      tel = COALESCE(v_candidato_telefono, tel),
      estado = 'activo',
      vehiculo_propio = COALESCE(v_vehiculo_propio, vehiculo_propio),
      updated_at = NOW()
    WHERE id = v_pc_custodio_id;
  END IF;

  -- 4. Buscar o crear custodios_operativos
  SELECT id INTO v_custodio_operativo_id
  FROM custodios_operativos
  WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
  LIMIT 1;

  IF v_custodio_operativo_id IS NULL THEN
    INSERT INTO custodios_operativos (
      nombre, telefono, email, estado, disponibilidad, vehiculo_propio, zona_base, pc_custodio_id, fuente, origen
    ) VALUES (
      v_nombre_normalizado, v_candidato_telefono, v_candidato_email, 'activo', 'disponible',
      COALESCE(v_vehiculo_propio, false), v_zona_base_nombre, v_pc_custodio_id, 'supply', 'liberacion'
    )
    RETURNING id INTO v_custodio_operativo_id;
  ELSE
    v_custodios_operativos_was_existing := TRUE;
    UPDATE custodios_operativos
    SET 
      pc_custodio_id = v_pc_custodio_id,
      telefono = COALESCE(v_candidato_telefono, telefono),
      email = COALESCE(v_candidato_email, email),
      vehiculo_propio = COALESCE(v_vehiculo_propio, vehiculo_propio),
      zona_base = COALESCE(v_zona_base_nombre, zona_base),
      estado = 'activo',
      disponibilidad = 'disponible',
      fecha_inactivacion = NULL,
      motivo_inactivacion = NULL,
      tipo_inactivacion = NULL,
      fecha_reactivacion_programada = NULL,
      fuente = 'supply',
      origen = 'liberacion',
      updated_at = NOW()
    WHERE id = v_custodio_operativo_id;
  END IF;

  -- 5. Sincronizar pc_custodio_id
  UPDATE custodio_liberacion
  SET pc_custodio_id = v_pc_custodio_id, updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 6. Generar token de invitación
  v_invitation_token := encode(gen_random_bytes(32), 'hex');

  -- 7. Actualizar estado de liberación
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = p_aprobado_por,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- 8. Actualizar estado del candidato
  UPDATE candidatos_custodios
  SET estado_proceso = 'liberado', updated_at = NOW()
  WHERE id = v_candidato_id;

  -- 9. Crear invitación pendiente
  INSERT INTO invitaciones_custodios (
    pc_custodio_id, token, email, estado, fecha_expiracion
  ) VALUES (
    v_pc_custodio_id, v_invitation_token, v_candidato_email, 'pendiente', NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (pc_custodio_id) 
  DO UPDATE SET
    token = v_invitation_token,
    email = v_candidato_email,
    estado = 'pendiente',
    fecha_expiracion = NOW() + INTERVAL '7 days',
    updated_at = NOW();

  -- 10. Registrar alerta para Planeación
  INSERT INTO alertas_sistema_nacional (
    tipo_alerta, categoria, titulo, descripcion, prioridad, estado, datos_contexto
  ) VALUES (
    'nuevo_custodio', 'supply', 'Nuevo custodio liberado',
    format('El custodio %s ha sido liberado y está disponible para asignación', v_nombre_normalizado),
    2, 'pendiente',
    jsonb_build_object(
      'custodio_operativo_id', v_custodio_operativo_id,
      'pc_custodio_id', v_pc_custodio_id,
      'nombre', v_nombre_normalizado,
      'telefono', v_candidato_telefono,
      'zona_base', v_zona_base_nombre,
      'fue_reactivacion', v_custodios_operativos_was_existing
    )
  );

  v_sync_status := jsonb_build_object(
    'pc_custodios_synced', v_pc_custodio_id IS NOT NULL,
    'custodios_operativos_synced', v_custodio_operativo_id IS NOT NULL,
    'pc_custodios_was_existing', v_pc_custodios_was_existing,
    'custodios_operativos_was_existing', v_custodios_operativos_was_existing,
    'nombre_normalizado', v_nombre_normalizado,
    'zona_base_asignada', v_zona_base_nombre,
    'fue_reactivacion', v_custodios_operativos_was_existing
  );

  RETURN jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_pc_custodio_id,
    'custodio_operativo_id', v_custodio_operativo_id,
    'candidato_id', v_candidato_id,
    'candidato_nombre', v_nombre_normalizado,
    'candidato_email', v_candidato_email,
    'candidato_telefono', v_candidato_telefono,
    'warnings', v_warnings,
    'fases_incompletas', v_fases_incompletas,
    'tiene_warnings', array_length(v_warnings, 1) > 0,
    'mensaje', CASE 
      WHEN v_custodios_operativos_was_existing THEN 
        format('Custodio %s REACTIVADO exitosamente', v_nombre_normalizado)
      ELSE 
        format('Custodio %s liberado exitosamente', v_nombre_normalizado)
    END,
    'invitation_token', v_invitation_token,
    'sync_status', v_sync_status
  );
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean) TO authenticated;
