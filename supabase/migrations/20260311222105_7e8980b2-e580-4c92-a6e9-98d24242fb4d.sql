
-- 1. Add lead_id column to evaluaciones_psicometricas
ALTER TABLE evaluaciones_psicometricas ADD COLUMN IF NOT EXISTS lead_id text;

-- 2. Retroactive patch: link orphaned evaluations via siercp_invitations
UPDATE evaluaciones_psicometricas ep
SET lead_id = si.lead_id
FROM siercp_invitations si
WHERE si.evaluacion_id = ep.id
  AND ep.lead_id IS NULL;

-- 3. Update RPC to also store lead_id
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
  WHERE token = p_token::uuid
    AND status IN ('pending', 'opened', 'started')
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token inválido, expirado o ya utilizado';
  END IF;

  INSERT INTO evaluaciones_psicometricas (
    candidato_id,
    lead_id,
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
    v_invitation.candidato_custodio_id,
    v_invitation.lead_id,
    NULL,
    p_score_integridad,
    p_score_psicopatia,
    p_score_violencia,
    p_score_agresividad,
    p_score_afrontamiento,
    p_score_veracidad,
    p_score_entrevista,
    p_score_global,
    'verde',
    p_interpretacion,
    'completado'
  )
  RETURNING id INTO v_evaluacion_id;

  UPDATE siercp_invitations
  SET status = 'completed',
      completed_at = now(),
      evaluacion_id = v_evaluacion_id
  WHERE id = v_invitation.id;

  RETURN v_evaluacion_id;
END;
$$;
