
-- 1) FK fix was already applied in previous migration, but ensure it's correct
ALTER TABLE public.evaluaciones_psicometricas 
  DROP CONSTRAINT IF EXISTS evaluaciones_psicometricas_evaluador_id_fkey;

ALTER TABLE public.evaluaciones_psicometricas 
  ADD CONSTRAINT evaluaciones_psicometricas_evaluador_id_fkey 
  FOREIGN KEY (evaluador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2) Drop existing function and recreate with evaluador_id = NULL fix
DROP FUNCTION IF EXISTS public.complete_siercp_assessment(text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text);

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

  -- FIX: evaluador_id = NULL for external self-assessments
  -- Previously used candidato_custodio_id which violates FK to profiles
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
    'verde',
    p_interpretacion,
    'completado'
  )
  RETURNING id INTO v_evaluacion_id;

  UPDATE siercp_invitations
  SET status = 'completed',
      completed_at = now()
  WHERE id = v_invitation.id;

  RETURN v_evaluacion_id;
END;
$$;
