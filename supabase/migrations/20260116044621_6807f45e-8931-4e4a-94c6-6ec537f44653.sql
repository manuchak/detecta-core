-- ============================================================
-- FIX CRÍTICO: Corregir RPC liberar_custodio_a_planeacion
-- Problema: Tabla "custodios_liberacion" no existe (es "custodio_liberacion")
-- y columnas incorrectas en pc_custodios y custodios_operativos
-- ============================================================

DROP FUNCTION IF EXISTS public.liberar_custodio_a_planeacion(uuid, uuid, boolean);

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
  v_liberacion_record RECORD;
  v_pc_custodio_id UUID;
  v_estado_actual TEXT;
  v_user_id UUID;
  v_user_role TEXT;
  v_telefono_normalizado TEXT;
  v_zona_texto TEXT;
BEGIN
  v_user_id := COALESCE(p_liberado_por, auth.uid());
  
  -- Verificar roles autorizados
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  LIMIT 1;
  
  IF v_user_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No tienes permisos para liberar custodios.'
    );
  END IF;

  -- FIX: Usar custodio_liberacion (singular, tabla real)
  SELECT cl.*, cc.nombre, cc.telefono, cc.email, 
         cc.zona_preferida_id, cc.vehiculo_propio
  INTO v_liberacion_record
  FROM custodio_liberacion cl
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

  IF v_estado_actual = 'liberado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El custodio ya fue liberado anteriormente'
    );
  END IF;

  -- Normalizar teléfono
  v_telefono_normalizado := regexp_replace(
    COALESCE(v_liberacion_record.telefono, ''), '[^0-9]', '', 'g'
  );
  IF length(v_telefono_normalizado) = 10 THEN
    v_telefono_normalizado := '+52' || v_telefono_normalizado;
  END IF;

  -- Obtener nombre de zona si existe
  SELECT nombre INTO v_zona_texto
  FROM zonas_operacion_nacional
  WHERE id = v_liberacion_record.zona_preferida_id;
  
  v_zona_texto := COALESCE(v_zona_texto, 'Por asignar');

  -- FIX: Usar custodio_liberacion (singular)
  UPDATE custodio_liberacion
  SET 
    estado_liberacion = 'liberado',
    liberado_por = v_user_id,
    fecha_liberacion = NOW(),
    updated_at = NOW()
  WHERE id = p_liberacion_id;

  UPDATE candidatos_custodios
  SET 
    estado_proceso = 'liberado',
    updated_at = NOW()
  WHERE id = v_candidato_id;

  -- FIX: Usar columnas correctas de pc_custodios (candidato_origen_id, tel, zona_base)
  SELECT id INTO v_pc_custodio_id
  FROM pc_custodios
  WHERE candidato_origen_id = v_candidato_id
  LIMIT 1;

  IF v_pc_custodio_id IS NULL THEN
    INSERT INTO pc_custodios (
      candidato_origen_id,
      nombre,
      tel,
      email,
      zona_base,
      estado,
      disponibilidad,
      vehiculo_propio,
      fecha_alta,
      created_at,
      updated_at
    ) VALUES (
      v_candidato_id,
      v_liberacion_record.nombre,
      v_telefono_normalizado,
      v_liberacion_record.email,
      v_zona_texto,
      'activo',
      'disponible',
      COALESCE(v_liberacion_record.vehiculo_propio, false),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_pc_custodio_id;
  ELSE
    UPDATE pc_custodios
    SET 
      nombre = v_liberacion_record.nombre,
      tel = v_telefono_normalizado,
      email = v_liberacion_record.email,
      zona_base = v_zona_texto,
      estado = 'activo',
      disponibilidad = 'disponible',
      vehiculo_propio = COALESCE(v_liberacion_record.vehiculo_propio, false),
      updated_at = NOW()
    WHERE id = v_pc_custodio_id;
  END IF;

  -- FIX: Usar columnas correctas de custodios_operativos (nombre, zona_base)
  INSERT INTO custodios_operativos (
    nombre,
    telefono,
    email,
    zona_base,
    estado,
    disponibilidad,
    vehiculo_propio,
    pc_custodio_id,
    created_at,
    updated_at
  ) VALUES (
    v_liberacion_record.nombre,
    v_telefono_normalizado,
    v_liberacion_record.email,
    v_zona_texto,
    'activo',
    'disponible',
    COALESCE(v_liberacion_record.vehiculo_propio, false),
    v_pc_custodio_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (pc_custodio_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email,
    zona_base = EXCLUDED.zona_base,
    estado = 'activo',
    disponibilidad = 'disponible',
    updated_at = NOW();

  -- Actualizar referencia en custodio_liberacion
  UPDATE custodio_liberacion
  SET pc_custodio_id = v_pc_custodio_id
  WHERE id = p_liberacion_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Custodio liberado exitosamente',
    'data', jsonb_build_object(
      'liberacion_id', p_liberacion_id,
      'candidato_id', v_candidato_id,
      'candidato_nombre', v_liberacion_record.nombre,
      'candidato_email', v_liberacion_record.email,
      'pc_custodio_id', v_pc_custodio_id
    )
  );
END;
$$;

-- Agregar índice único en custodios_operativos.pc_custodio_id si no existe
CREATE UNIQUE INDEX IF NOT EXISTS idx_custodios_operativos_pc_custodio_id_unique 
ON custodios_operativos(pc_custodio_id) 
WHERE pc_custodio_id IS NOT NULL;