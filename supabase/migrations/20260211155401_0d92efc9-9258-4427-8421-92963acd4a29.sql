
CREATE OR REPLACE FUNCTION public.complete_siercp_assessment(
  p_token UUID,
  p_score_integridad NUMERIC,
  p_score_psicopatia NUMERIC,
  p_score_violencia NUMERIC,
  p_score_agresividad NUMERIC,
  p_score_afrontamiento NUMERIC,
  p_score_veracidad NUMERIC,
  p_score_entrevista NUMERIC,
  p_score_global NUMERIC,
  p_resultado_semaforo TEXT,
  p_interpretacion TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_evaluacion_id UUID;
BEGIN
  -- 1. Validate token
  SELECT id, lead_id, candidato_custodio_id, status, expires_at, lead_nombre
  INTO v_invitation
  FROM siercp_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token no encontrado';
  END IF;

  IF v_invitation.status = 'completed' THEN
    RAISE EXCEPTION 'Esta evaluación ya fue completada';
  END IF;

  IF v_invitation.status = 'cancelled' THEN
    RAISE EXCEPTION 'Esta invitación fue cancelada';
  END IF;

  IF v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'El enlace ha expirado';
  END IF;

  -- 2. Insert evaluation record
  INSERT INTO evaluaciones_psicometricas (
    candidato_id,
    evaluador_id,
    score_integridad,
    score_psicopatia,
    score_violencia,
    score_agresividad,
    score_afrontamiento,
    score_veracidad,
    score_entrevista,
    score_global,
    interpretacion_clinica,
    resultado_semaforo,
    estado
  ) VALUES (
    v_invitation.candidato_custodio_id,
    NULL,
    p_score_integridad,
    p_score_psicopatia,
    p_score_violencia,
    p_score_agresividad,
    p_score_afrontamiento,
    p_score_veracidad,
    p_score_entrevista,
    p_score_global,
    p_interpretacion,
    p_resultado_semaforo,
    'completado'
  ) RETURNING id INTO v_evaluacion_id;

  -- 3. Update invitation
  UPDATE siercp_invitations
  SET status = 'completed',
      completed_at = now(),
      evaluacion_id = v_evaluacion_id,
      updated_at = now()
  WHERE id = v_invitation.id;

  RETURN v_evaluacion_id;
END;
$$;

-- Grant execute to anon so unauthenticated candidates can call it
GRANT EXECUTE ON FUNCTION public.complete_siercp_assessment TO anon;
GRANT EXECUTE ON FUNCTION public.complete_siercp_assessment TO authenticated;
