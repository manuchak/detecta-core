
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
  v_pausa RECORD;
  v_item jsonb;
  v_servicio_id text;
  v_temp_monitorista text;
  v_restored int := 0;
  v_skipped int := 0;
BEGIN
  -- Find the active pause
  IF p_pausa_id IS NOT NULL THEN
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE id = p_pausa_id AND estado = 'activa';
  ELSIF p_monitorista_id IS NOT NULL THEN
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE monitorista_id = p_monitorista_id AND estado = 'activa' ORDER BY inicio DESC LIMIT 1;
  ELSE
    SELECT * INTO v_pausa FROM bitacora_pausas_monitorista WHERE monitorista_id = p_caller_id AND estado = 'activa' ORDER BY inicio DESC LIMIT 1;
  END IF;

  IF v_pausa IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No se encontró pausa activa');
  END IF;

  -- Mark pause as completed
  UPDATE bitacora_pausas_monitorista
  SET estado = 'completada', fin_real = now()
  WHERE id = v_pausa.id;

  -- Restore services that were redistributed (only if still active)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_pausa.servicios_redistribuidos)
  LOOP
    v_servicio_id := v_item->>'servicio_id';
    v_temp_monitorista := v_item->>'temporal_monitorista_id';

    -- Only restore if service is still active (not completed/canceled)
    IF EXISTS (
      SELECT 1 FROM servicios_planificados
      WHERE id_servicio = v_servicio_id
        AND hora_fin_real IS NULL
        AND estado_planeacion NOT IN ('completado', 'cancelado')
    ) THEN
      -- Deactivate the temporary assignment
      UPDATE bitacora_asignaciones_monitorista
      SET activo = false, fin_turno = now()
      WHERE servicio_id = v_servicio_id
        AND activo = true;

      -- Restore original monitorista assignment
      INSERT INTO bitacora_asignaciones_monitorista (
        servicio_id, monitorista_id, turno, inicio_turno, activo, notas_handoff
      ) VALUES (
        v_servicio_id,
        v_pausa.monitorista_id,
        (SELECT CASE
          WHEN EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Mexico_City') >= 7
               AND EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Mexico_City') < 19
          THEN 'matutino' ELSE 'nocturno' END),
        now(),
        true,
        'retorno_pausa'
      );

      v_restored := v_restored + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  -- Log anomaly
  INSERT INTO bitacora_anomalias_turno (tipo, descripcion, monitorista_original, ejecutado_por)
  VALUES (
    'fin_pausa',
    format('Pausa %s finalizada. %s servicios restaurados, %s omitidos (completados/cancelados)', v_pausa.tipo_pausa, v_restored, v_skipped),
    v_pausa.monitorista_id,
    p_caller_id
  );

  RETURN jsonb_build_object(
    'ok', true,
    'pausa_id', v_pausa.id,
    'restored', v_restored,
    'skipped', v_skipped
  );
END;
$$;
