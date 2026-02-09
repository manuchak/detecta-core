
-- Drop both overloads to clean up
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion_v2(uuid, uuid, boolean);

-- Recreate single version with correct schema (no 'origen' column, using 'tel' for pc_custodios)
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
  v_candidato RECORD;
  v_candidato_nombre TEXT;
  v_candidato_email TEXT;
  v_candidato_telefono TEXT;
  v_vehiculo_propio BOOLEAN;
  v_zona_base TEXT;
  v_nombre_normalizado TEXT;
  v_pc_custodio_id UUID;
  v_operativo_id UUID;
  v_existing_pc RECORD;
  v_existing_operativo RECORD;
  v_user_role TEXT;
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

  -- 2. Get candidate data from custodios_liberacion
  SELECT * INTO v_candidato
  FROM custodios_liberacion
  WHERE id = p_custodio_liberacion_id;

  IF v_candidato IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Registro de liberación no encontrado'
    );
  END IF;

  -- Check if already released (unless forcing)
  IF v_candidato.estado_liberacion = 'liberado' AND NOT p_forzar_liberacion THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Este custodio ya fue liberado anteriormente'
    );
  END IF;

  -- Extract candidate fields
  v_candidato_nombre := v_candidato.nombre;
  v_candidato_email := v_candidato.email;
  v_candidato_telefono := v_candidato.telefono;
  v_vehiculo_propio := COALESCE(v_candidato.vehiculo_propio, false);
  v_zona_base := v_candidato.zona_operacion;
  v_nombre_normalizado := TRIM(v_candidato_nombre);

  -- 3. Handle pc_custodios (check existing by pc_custodio_id or create new)
  IF v_candidato.pc_custodio_id IS NOT NULL THEN
    SELECT id INTO v_existing_pc
    FROM pc_custodios
    WHERE id = v_candidato.pc_custodio_id;

    IF v_existing_pc IS NOT NULL THEN
      v_pc_custodio_id := v_existing_pc.id;
      -- Reactivate existing record
      UPDATE pc_custodios
      SET
        estado = 'activo',
        tel = COALESCE(v_candidato_telefono, tel),
        email = COALESCE(v_candidato_email, email),
        updated_at = NOW()
      WHERE id = v_pc_custodio_id;
    END IF;
  END IF;

  -- Create new pc_custodio if not found
  IF v_pc_custodio_id IS NULL THEN
    INSERT INTO pc_custodios (
      nombre, email, tel, estado, vehiculo_propio
    )
    VALUES (
      v_nombre_normalizado, v_candidato_email, v_candidato_telefono, 'activo', v_vehiculo_propio
    )
    RETURNING id INTO v_pc_custodio_id;
  END IF;

  -- 4. Handle custodios_operativos (check existing or create new)
  SELECT id INTO v_existing_operativo
  FROM custodios_operativos
  WHERE pc_custodio_id = v_pc_custodio_id
  LIMIT 1;

  IF v_existing_operativo IS NOT NULL THEN
    v_operativo_id := v_existing_operativo.id;
    -- Reactivate existing record
    UPDATE custodios_operativos
    SET
      estado = 'activo',
      disponibilidad = 'disponible',
      fuente = 'supply',
      pc_custodio_id = v_pc_custodio_id,
      telefono = COALESCE(v_candidato_telefono, telefono),
      email = COALESCE(v_candidato_email, email),
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
      v_nombre_normalizado, v_candidato_telefono, v_candidato_email,
      'activo', 'disponible', v_vehiculo_propio, v_zona_base, v_pc_custodio_id, 'supply'
    )
    RETURNING id INTO v_operativo_id;
  END IF;

  -- 5. Update custodios_liberacion with sync info
  UPDATE custodios_liberacion
  SET
    estado_liberacion = 'liberado',
    pc_custodio_id = v_pc_custodio_id,
    aprobado_por = p_aprobado_por,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_custodio_liberacion_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'pc_custodio_id', v_pc_custodio_id,
    'operativo_id', v_operativo_id,
    'nombre', v_nombre_normalizado,
    'mensaje', 'Custodio liberado exitosamente a planeación'
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.liberar_custodio_a_planeacion_v2(UUID, UUID, BOOLEAN) TO authenticated;
