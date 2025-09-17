-- Drop existing functions and recreate with correct structure
DROP FUNCTION IF EXISTS public.update_approval_process(text,text,text,text,text,text);

-- Create the missing update_approval_process function that is referenced in the hook
CREATE OR REPLACE FUNCTION public.update_approval_process(
  p_lead_id text,
  p_stage text,
  p_interview_method text,
  p_notes text,
  p_decision text,
  p_decision_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar permisos para actualizar proceso de aprobación
  IF NOT (
    public.is_admin_user_secure() OR 
    public.user_has_role_direct('supply_admin') OR 
    public.user_has_role_direct('supply_lead') OR 
    public.user_has_role_direct('ejecutivo_ventas') OR
    public.user_has_role_direct('analista_seguridad') OR
    public.user_has_role_direct('admin') OR
    public.user_has_role_direct('owner')
  ) THEN
    RAISE EXCEPTION 'Sin permisos para actualizar proceso de aprobación';
  END IF;
  
  INSERT INTO public.lead_approval_process (
    lead_id,
    analyst_id,
    current_stage,
    interview_method,
    phone_interview_notes,
    final_decision,
    decision_reason,
    phone_interview_completed,
    updated_at
  ) VALUES (
    p_lead_id,
    current_user_id,
    p_stage,
    p_interview_method,
    p_notes,
    p_decision,
    p_decision_reason,
    CASE WHEN p_stage IN ('approved', 'rejected') THEN true ELSE false END,
    now()
  )
  ON CONFLICT (lead_id) DO UPDATE SET
    analyst_id = current_user_id,
    current_stage = p_stage,
    interview_method = p_interview_method,
    phone_interview_notes = p_notes,
    final_decision = p_decision,
    decision_reason = p_decision_reason,
    phone_interview_completed = CASE WHEN p_stage IN ('approved', 'rejected') THEN true ELSE false END,
    updated_at = now();
  
  RETURN true;
END;
$$;