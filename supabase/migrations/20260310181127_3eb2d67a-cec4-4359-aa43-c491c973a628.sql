
-- Transactional RPC: iniciar pausa monitorista
CREATE OR REPLACE FUNCTION public.fn_iniciar_pausa(
  p_user_id uuid,
  p_tipo_pausa text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duracion int;
  v_now timestamptz := now();
  v_fin_esperado timestamptz;
  v_turno text;
  v_hour int;
  v_orig record;
  v_target_id uuid;
  v_available uuid[];
  v_loads jsonb := '{}'::jsonb;
  v_redistribuidos jsonb := '[]'::jsonb;
  v_count int := 0;
  v_min_load int;
  v_five_min_ago timestamptz;
BEGIN
  -- Validate tipo_pausa
  IF p_tipo_pausa = 'desayuno' THEN v_duracion := 20;
  ELSIF p_tipo_pausa = 'comida' THEN v_duracion := 60;
  ELSIF p_tipo_pausa = 'bano' THEN v_duracion := 10;
  ELSIF p_tipo_pausa = 'descanso' THEN v_duracion := 10;
  ELSE RAISE EXCEPTION 'Tipo de pausa inválido: %', p_tipo_pausa;
  END IF;

  v_fin_esperado := v_now + (v_duracion || ' minutes')::interval;

  -- Check no active pause
  IF EXISTS (
    SELECT 1 FROM bitacora_pausas_monitorista
    WHERE monitorista_id = p_user_id AND estado = 'activa'
  ) THEN
    RAISE EXCEPTION 'Ya tienes una pausa activa';
  END IF;

  -- Check user has assignments
  IF NOT EXISTS (
    SELECT 1 FROM bitacora_asignaciones_monitorista
    WHERE monitorista_id = p_user_id AND activo = true
  ) THEN
    RAISE EXCEPTION 'No tienes servicios asignados';
  END IF;

  -- Determine turno
  v_hour := EXTRACT(HOUR FROM v_now AT TIME ZONE 'America/Mexico_City')::int;
  IF v_hour >= 6 AND v_hour < 14 THEN v_turno := 'matutino';
  ELSIF v_hour >= 14 AND v_hour < 22 THEN v_turno := 'vespertino';
  ELSE v_turno := 'nocturno';
  END IF;

  -- Get available monitoristas (online, not paused, not self)
  v_five_min_ago := v_now - interval '5 minutes';
  
  SELECT array_agg(DISTINCT ur.user_id)
  INTO v_available
  FROM user_roles ur
  INNER JOIN monitorista_heartbeat mh ON mh.user_id = ur.user_id
  WHERE ur.role IN ('monitoring', 'monitoring_supervisor')
    AND ur.is_active = true
    AND mh.last_ping >= v_five_min_ago
    AND ur.user_id != p_user_id
    AND ur.user_id NOT IN (
      SELECT monitorista_id FROM bitacora_pausas_monitorista WHERE estado = 'activa'
    );

  IF v_available IS NULL OR array_length(v_available, 1) IS NULL THEN
    RAISE EXCEPTION 'No hay monitoristas disponibles para cubrir tu pausa';
  END IF;

  -- Build loads map
  FOR v_target_id IN SELECT unnest(v_available) LOOP
    v_loads := v_loads || jsonb_build_object(
      v_target_id::text,
      COALESCE((SELECT count(*) FROM bitacora_asignaciones_monitorista WHERE monitorista_id = v_target_id AND activo = true), 0)
    );
  END LOOP;

  -- Redistribute each assignment
  FOR v_orig IN
    SELECT id, servicio_id, turno as orig_turno
    FROM bitacora_asignaciones_monitorista
    WHERE monitorista_id = p_user_id AND activo = true
  LOOP
    -- Find monitorista with minimum load
    SELECT key::uuid INTO v_target_id
    FROM jsonb_each_text(v_loads)
    ORDER BY value::int ASC
    LIMIT 1;

    -- Deactivate original (Deactivate-by-Service pattern)
    UPDATE bitacora_asignaciones_monitorista
    SET activo = false, fin_turno = v_now
    WHERE servicio_id = v_orig.servicio_id AND activo = true;

    -- Create temporary assignment
    INSERT INTO bitacora_asignaciones_monitorista (servicio_id, monitorista_id, asignado_por, turno, notas_handoff)
    VALUES (v_orig.servicio_id, v_target_id, p_user_id, v_turno, 'pausa_interina');

    -- Track redistribution
    v_redistribuidos := v_redistribuidos || jsonb_build_array(jsonb_build_object(
      'servicio_id', v_orig.servicio_id,
      'assignment_original_id', v_orig.id,
      'asignado_temporalmente_a', v_target_id
    ));

    -- Increment load
    v_loads := v_loads || jsonb_build_object(
      v_target_id::text,
      (v_loads->>v_target_id::text)::int + 1
    );
    v_count := v_count + 1;
  END LOOP;

  -- Insert pause record (INSIDE the same transaction)
  INSERT INTO bitacora_pausas_monitorista (monitorista_id, tipo_pausa, servicios_redistribuidos, fin_esperado)
  VALUES (p_user_id, p_tipo_pausa, v_redistribuidos, v_fin_esperado);

  -- Log anomaly
  INSERT INTO bitacora_anomalias_turno (tipo, descripcion, ejecutado_por, monitorista_original, metadata)
  VALUES (
    'pausa_iniciada',
    format('Pausa de %s iniciada. %s servicios redistribuidos.', p_tipo_pausa, v_count),
    p_user_id, p_user_id,
    jsonb_build_object('tipo_pausa', p_tipo_pausa, 'redistribuidos_count', v_count)
  );

  RETURN jsonb_build_object('success', true, 'count', v_count, 'tipo', p_tipo_pausa);
END;
$$;

-- Transactional RPC: finalizar pausa monitorista
CREATE OR REPLACE FUNCTION public.fn_finalizar_pausa(
  p_caller_id uuid,
  p_pausa_id uuid DEFAULT NULL,
  p_monitorista_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pausa record;
  v_now timestamptz := now();
  v_hour int;
  v_turno text;
  v_item jsonb;
  v_count int := 0;
  v_forced boolean := false;
BEGIN
  -- Find active pause
  IF p_pausa_id IS NOT NULL THEN
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE id = p_pausa_id AND estado = 'activa';
  ELSIF p_monitorista_id IS NOT NULL THEN
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE monitorista_id = p_monitorista_id AND estado = 'activa' ORDER BY inicio DESC LIMIT 1;
  ELSE
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE monitorista_id = p_caller_id AND estado = 'activa' ORDER BY inicio DESC LIMIT 1;
  END IF;

  IF v_pausa IS NULL THEN
    RAISE EXCEPTION 'No hay pausa activa para finalizar';
  END IF;

  -- Authorization check: if caller != pausa owner, must be coordinator
  IF v_pausa.monitorista_id != p_caller_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = p_caller_id AND is_active = true
        AND role IN ('admin', 'owner', 'monitoring_supervisor', 'coordinador_operaciones')
    ) THEN
      RAISE EXCEPTION 'No tienes permisos para finalizar pausas de otros';
    END IF;
    v_forced := true;
  END IF;

  -- Determine turno
  v_hour := EXTRACT(HOUR FROM v_now AT TIME ZONE 'America/Mexico_City')::int;
  IF v_hour >= 6 AND v_hour < 14 THEN v_turno := 'matutino';
  ELSIF v_hour >= 14 AND v_hour < 22 THEN v_turno := 'vespertino';
  ELSE v_turno := 'nocturno';
  END IF;

  -- Restore assignments from redistribution list
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_pausa.servicios_redistribuidos, '[]'::jsonb))
  LOOP
    -- Deactivate temporary (by service)
    UPDATE bitacora_asignaciones_monitorista
    SET activo = false, fin_turno = v_now
    WHERE servicio_id = (v_item->>'servicio_id') AND activo = true;

    -- Recreate original
    INSERT INTO bitacora_asignaciones_monitorista (servicio_id, monitorista_id, asignado_por, turno, notas_handoff)
    VALUES ((v_item->>'servicio_id'), v_pausa.monitorista_id, p_caller_id, v_turno, 'retorno_pausa');

    v_count := v_count + 1;
  END LOOP;

  -- Mark pause as finalizada
  UPDATE bitacora_pausas_monitorista SET estado = 'finalizada', fin_real = v_now WHERE id = v_pausa.id;

  -- Log
  INSERT INTO bitacora_anomalias_turno (tipo, descripcion, ejecutado_por, monitorista_original, metadata)
  VALUES (
    CASE WHEN v_forced THEN 'pausa_forzada_fin' ELSE 'pausa_finalizada' END,
    CASE WHEN v_forced
      THEN format('Pausa de %s finalizada forzosamente por coordinador.', v_pausa.tipo_pausa)
      ELSE format('Pausa de %s finalizada. %s servicios restaurados.', v_pausa.tipo_pausa, v_count)
    END,
    p_caller_id, v_pausa.monitorista_id,
    jsonb_build_object('pausa_id', v_pausa.id, 'redistribuidos_count', v_count, 'forced', v_forced)
  );

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;
