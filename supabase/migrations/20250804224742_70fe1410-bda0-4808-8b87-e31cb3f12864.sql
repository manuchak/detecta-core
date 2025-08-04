-- Eliminar todas las versiones existentes de la función update_approval_process
DROP FUNCTION IF EXISTS public.update_approval_process(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.update_approval_process(uuid, text, text, text, text, text);

-- Crear una versión única y consistente de la función
CREATE OR REPLACE FUNCTION public.update_approval_process(
  p_lead_id text,
  p_stage text,
  p_interview_method text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_decision text DEFAULT NULL,
  p_decision_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Insertar o actualizar el registro del proceso de aprobación
  INSERT INTO public.lead_approval_process (
    lead_id,
    analyst_id,
    current_stage,
    interview_method,
    phone_interview_notes,
    final_decision,
    decision_reason,
    phone_interview_completed,
    second_interview_required,
    updated_at
  )
  VALUES (
    p_lead_id,
    current_user_id,
    p_stage,
    p_interview_method,
    p_notes,
    p_decision,
    p_decision_reason,
    CASE WHEN p_stage IN ('approved', 'rejected', 'second_interview') THEN true ELSE false END,
    CASE WHEN p_stage = 'second_interview' THEN true ELSE false END,
    now()
  )
  ON CONFLICT (lead_id)
  DO UPDATE SET
    current_stage = EXCLUDED.current_stage,
    interview_method = COALESCE(EXCLUDED.interview_method, lead_approval_process.interview_method),
    phone_interview_notes = COALESCE(EXCLUDED.phone_interview_notes, lead_approval_process.phone_interview_notes),
    final_decision = EXCLUDED.final_decision,
    decision_reason = COALESCE(EXCLUDED.decision_reason, lead_approval_process.decision_reason),
    phone_interview_completed = EXCLUDED.phone_interview_completed,
    second_interview_required = EXCLUDED.second_interview_required,
    updated_at = now();
END;
$$;