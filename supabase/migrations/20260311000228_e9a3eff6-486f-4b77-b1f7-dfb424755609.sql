-- 1. Fix fn_finalizar_pausa: change 'completada' → 'finalizada'
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
  v_redistribuido record;
  v_restored int := 0;
  v_skipped int := 0;
BEGIN
  -- Find the active pause
  IF p_pausa_id IS NOT NULL THEN
    SELECT * INTO v_pausa
    FROM bitacora_pausas_monitorista
    WHERE id = p_pausa_id AND estado = 'activa';
  ELSIF p_monitorista_id IS NOT NULL THEN
    SELECT * INTO v_pausa
    FROM bitacora_pausas_monitorista
    WHERE monitorista_id = p_monitorista_id AND estado = 'activa'
    ORDER BY inicio DESC LIMIT 1;
  ELSE
    SELECT * INTO v_pausa
    FROM bitacora_pausas_monitorista
    WHERE monitorista_id = p_caller_id AND estado = 'activa'
    ORDER BY inicio DESC LIMIT 1;
  END IF;

  IF v_pausa IS NULL THEN
    RETURN jsonb_build_object('error', 'No hay pausa activa para finalizar');
  END IF;

  -- Mark pause as finalizada (NOT 'completada' which violates CHECK)
  UPDATE bitacora_pausas_monitorista
  SET estado = 'finalizada', fin_real = now()
  WHERE id = v_pausa.id;

  -- Restore original assignments
  IF v_pausa.servicios_redistribuidos IS NOT NULL 
     AND jsonb_array_length(v_pausa.servicios_redistribuidos) > 0 THEN
    FOR v_redistribuido IN
      SELECT * FROM jsonb_array_elements(v_pausa.servicios_redistribuidos)
    LOOP
      IF EXISTS (
        SELECT 1 FROM bitacora_asignaciones_monitorista
        WHERE servicio_id = (v_redistribuido.value->>'servicio_id')
          AND activo = true
      ) THEN
        UPDATE bitacora_asignaciones_monitorista
        SET activo = false, fin_turno = now()
        WHERE servicio_id = (v_redistribuido.value->>'servicio_id')
          AND activo = true;

        INSERT INTO bitacora_asignaciones_monitorista (
          servicio_id, monitorista_id, turno, inicio_turno, activo, asignado_por
        ) VALUES (
          (v_redistribuido.value->>'servicio_id'),
          v_pausa.monitorista_id,
          'pausa_restore',
          now(),
          true,
          p_caller_id
        )
        ON CONFLICT DO NOTHING;

        v_restored := v_restored + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'pausa_id', v_pausa.id,
    'restored', v_restored,
    'skipped', v_skipped
  );
END;
$$;

-- 2. Add 'desayuno' to tipo_pausa CHECK constraint
ALTER TABLE bitacora_pausas_monitorista
  DROP CONSTRAINT IF EXISTS bitacora_pausas_monitorista_tipo_pausa_check;

ALTER TABLE bitacora_pausas_monitorista
  ADD CONSTRAINT bitacora_pausas_monitorista_tipo_pausa_check
  CHECK (tipo_pausa IN ('comida', 'bano', 'descanso', 'desayuno'));