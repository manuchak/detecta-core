-- ============================================================
-- FIX: Eliminar funciones duplicadas y recrear con search_path correcto
-- Problema: Existen dos versiones del RPC, el frontend llama a la antigua
-- que no tiene 'extensions' en search_path, causando error gen_random_bytes
-- ============================================================

-- Eliminar AMBAS versiones de la función
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion(uuid, boolean);
DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion(uuid, uuid, boolean);

-- Recrear función única con firma que coincide con el frontend
CREATE OR REPLACE FUNCTION public.liberar_custodio_a_planeacion(
  p_liberacion_id UUID,
  p_liberado_por UUID DEFAULT NULL,
  p_forzar_liberacion BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_candidato_id UUID;
  v_candidato_record RECORD;
  v_liberacion_record RECORD;
  v_pc_custodio_id UUID;
  v_estado_actual TEXT;
  v_user_id UUID;
  v_user_role TEXT;
  v_token TEXT;
  v_nuevo_estado TEXT := 'liberado';
BEGIN
  -- Obtener el usuario que ejecuta
  v_user_id := COALESCE(p_liberado_por, auth.uid());
  
  -- Verificar que el usuario tiene rol autorizado
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  LIMIT 1;
  
  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para liberar custodios. Roles requeridos: admin, owner, supply_admin, supply_lead'
    );
  END IF;

  -- Obtener datos de liberación
  SELECT cl.*, cc.nombre, cc.telefono, cc.email, cc.zona_preferida_id, cc.vehiculo_propio
  INTO v_liberacion_record
  FROM custodios_liberacion cl
  JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
  WHERE cl.id = p_liberacion_id;

  IF v_liberacion_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No se encontró el registro de liberación'
    );
  END IF;

  v_candidato_id := v_liberacion_record.candidato_id;
  v_estado_actual := v_liberacion_record.estado_liberacion;

  -- Verificar estado actual (permitir forzar si p_forzar_liberacion = true)
  IF v_estado_actual = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El custodio ya fue liberado anteriormente'
    );
  END IF;

  IF NOT p_forzar_liberacion AND v_estado_actual NOT IN ('aprobado_final', 'gps') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El custodio no está en estado válido para liberación. Estado actual: ' || v_estado_actual
    );
  END IF;

  -- Generar token de invitación usando gen_random_bytes (ahora accesible via search_path)
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Actualizar custodios_liberacion
  UPDATE custodios_liberacion
  SET 
    estado_liberacion = v_nuevo_estado,
    liberado_por = v_user_id,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_liberacion_id;

  -- Actualizar candidatos_custodios
  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'liberado',
    estado_detallado = 'Liberado a planeación',
    updated_at = NOW()
  WHERE id = v_candidato_id;

  -- Normalizar teléfono
  DECLARE
    v_telefono_normalizado TEXT;
  BEGIN
    v_telefono_normalizado := regexp_replace(COALESCE(v_liberacion_record.telefono, ''), '[^0-9]', '', 'g');
    IF length(v_telefono_normalizado) = 10 THEN
      v_telefono_normalizado := '+52' || v_telefono_normalizado;
    ELSIF length(v_telefono_normalizado) = 12 AND v_telefono_normalizado LIKE '52%' THEN
      v_telefono_normalizado := '+' || v_telefono_normalizado;
    ELSIF length(v_telefono_normalizado) = 13 AND v_telefono_normalizado LIKE '+52%' THEN
      -- Ya está normalizado
    ELSE
      v_telefono_normalizado := v_liberacion_record.telefono;
    END IF;

    -- Buscar o crear pc_custodio
    SELECT id INTO v_pc_custodio_id
    FROM pc_custodios
    WHERE candidato_id = v_candidato_id
    LIMIT 1;

    IF v_pc_custodio_id IS NULL THEN
      INSERT INTO pc_custodios (
        candidato_id,
        nombre,
        telefono,
        email,
        zona_operacion_id,
        estado,
        fecha_alta,
        invitation_token,
        invitation_expires_at,
        created_at,
        updated_at
      ) VALUES (
        v_candidato_id,
        v_liberacion_record.nombre,
        v_telefono_normalizado,
        v_liberacion_record.email,
        v_liberacion_record.zona_preferida_id,
        'pendiente_activacion',
        NOW(),
        v_token,
        NOW() + INTERVAL '7 days',
        NOW(),
        NOW()
      )
      RETURNING id INTO v_pc_custodio_id;
    ELSE
      UPDATE pc_custodios
      SET 
        nombre = v_liberacion_record.nombre,
        telefono = v_telefono_normalizado,
        email = v_liberacion_record.email,
        zona_operacion_id = v_liberacion_record.zona_preferida_id,
        estado = 'pendiente_activacion',
        invitation_token = v_token,
        invitation_expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
      WHERE id = v_pc_custodio_id;
    END IF;

    -- Sincronizar con custodios_operativos
    INSERT INTO custodios_operativos (
      pc_custodio_id,
      nombre_completo,
      telefono,
      email,
      zona_operacion_id,
      estado,
      vehiculo_propio,
      created_at,
      updated_at
    ) VALUES (
      v_pc_custodio_id,
      v_liberacion_record.nombre,
      v_telefono_normalizado,
      v_liberacion_record.email,
      v_liberacion_record.zona_preferida_id,
      'pendiente_activacion',
      COALESCE(v_liberacion_record.vehiculo_propio, false),
      NOW(),
      NOW()
    )
    ON CONFLICT (pc_custodio_id) DO UPDATE SET
      nombre_completo = EXCLUDED.nombre_completo,
      telefono = EXCLUDED.telefono,
      email = EXCLUDED.email,
      zona_operacion_id = EXCLUDED.zona_operacion_id,
      estado = 'pendiente_activacion',
      vehiculo_propio = EXCLUDED.vehiculo_propio,
      updated_at = NOW();
  END;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Custodio liberado exitosamente a planeación',
    'data', jsonb_build_object(
      'liberacion_id', p_liberacion_id,
      'candidato_id', v_candidato_id,
      'pc_custodio_id', v_pc_custodio_id,
      'estado', v_nuevo_estado,
      'liberado_por', v_user_id,
      'fecha_liberacion', NOW()
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Error al liberar custodio: ' || SQLERRM
  );
END;
$$;

-- Comentario para documentación
COMMENT ON FUNCTION public.liberar_custodio_a_planeacion(uuid, uuid, boolean) IS 
'Libera un custodio desde el proceso de onboarding a planeación operativa.
Roles autorizados: admin, owner, supply_admin, supply_lead.
Fix: search_path incluye extensions para acceder a gen_random_bytes.';