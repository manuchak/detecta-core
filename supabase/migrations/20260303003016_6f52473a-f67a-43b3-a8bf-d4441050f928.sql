-- Drop existing function with exact signature
DROP FUNCTION IF EXISTS public.complete_siercp_assessment(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, text);

-- Recreate with p_token as text and p_resultado_semaforo ignored
CREATE OR REPLACE FUNCTION public.complete_siercp_assessment(
  p_token text,
  p_score_integridad numeric,
  p_score_psicopatia numeric,
  p_score_violencia numeric,
  p_score_agresividad numeric,
  p_score_afrontamiento numeric,
  p_score_veracidad numeric,
  p_score_entrevista numeric,
  p_score_global numeric,
  p_resultado_semaforo text DEFAULT 'verde',
  p_interpretacion text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_evaluacion_id uuid;
BEGIN
  SELECT * INTO v_invitation
  FROM siercp_invitations
  WHERE token = p_token
    AND status IN ('pending', 'opened', 'started')
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido, expirado o ya utilizado';
  END IF;

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
    resultado_semaforo,
    interpretacion_clinica,
    estado
  ) VALUES (
    v_invitation.candidato_id,
    v_invitation.candidato_id,
    p_score_integridad,
    p_score_psicopatia,
    p_score_violencia,
    p_score_agresividad,
    p_score_afrontamiento,
    p_score_veracidad,
    p_score_entrevista,
    p_score_global,
    'verde',  -- Placeholder: trigger calculate_semaforo_psicometrico() lo sobreescribe
    p_interpretacion,
    'completo'
  )
  RETURNING id INTO v_evaluacion_id;

  UPDATE siercp_invitations
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_invitation.id;

  RETURN v_evaluacion_id;
END;
$$;

COMMENT ON FUNCTION public.complete_siercp_assessment(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, text) IS 
'RPC atómica SIERCP. p_resultado_semaforo IGNORADO - trigger DB es fuente de verdad (>=70 verde, >=50 ambar, <50 rojo).';