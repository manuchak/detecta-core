-- Create secure function to update lead state after interview
CREATE OR REPLACE FUNCTION public.update_lead_state_after_interview(
  p_lead_id text,
  p_new_status text,
  p_interview_notes text DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario tiene permisos para actualizar leads
  IF NOT (
    is_admin_user_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('supply_lead') OR 
    user_has_role_direct('ejecutivo_ventas') OR
    user_has_role_direct('analista_seguridad')
  ) THEN
    RAISE EXCEPTION 'Sin permisos para actualizar estado de leads';
  END IF;

  -- Actualizar el lead
  UPDATE public.leads 
  SET 
    status = p_new_status,
    updated_at = now(),
    rejection_reason = CASE WHEN p_rejection_reason IS NOT NULL THEN p_rejection_reason ELSE rejection_reason END
  WHERE id = p_lead_id;

  -- Actualizar proceso de aprobación con notas de entrevista
  IF p_interview_notes IS NOT NULL THEN
    UPDATE public.lead_approval_process
    SET 
      phone_interview_notes = p_interview_notes,
      phone_interview_completed = CASE WHEN p_new_status IN ('approved', 'rejected') THEN true ELSE phone_interview_completed END,
      current_stage = CASE 
        WHEN p_new_status = 'approved' THEN 'approved'
        WHEN p_new_status = 'rejected' THEN 'rejected' 
        WHEN p_new_status = 'second_interview_needed' THEN 'second_interview_needed'
        ELSE current_stage 
      END,
      updated_at = now()
    WHERE lead_id = p_lead_id;
  END IF;

  RETURN true;
END;
$function$;

-- Update existing functions to include analista_seguridad role
CREATE OR REPLACE FUNCTION public.save_interview_session(p_lead_id text, p_session_id uuid, p_interview_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificación explícita de permisos para roles autorizados (incluyendo analista_seguridad)
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas') OR
        user_has_role_direct('analista_seguridad')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para guardar sesión de entrevista';
    END IF;

    -- Actualizar tabla leads con datos de entrevista
    UPDATE public.leads 
    SET 
        interview_data = COALESCE(interview_data, '{}'::jsonb) || p_interview_data,
        interview_session_id = p_session_id,
        updated_at = now()
    WHERE id = p_lead_id;
    
    -- Actualizar o crear registro del proceso de aprobación
    INSERT INTO public.lead_approval_process (
        lead_id,
        analyst_id,
        current_stage,
        last_session_id,
        updated_at
    )
    VALUES (
        p_lead_id,
        auth.uid(),
        'interview_in_progress',
        p_session_id,
        now()
    )
    ON CONFLICT (lead_id)
    DO UPDATE SET
        last_session_id = p_session_id,
        updated_at = now();
    
    RETURN true;
END;
$function$;

-- Update mark_interview_interrupted function  
CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(p_lead_id text, p_session_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificación explícita de permisos para roles autorizados (incluyendo analista_seguridad)
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas') OR
        user_has_role_direct('analista_seguridad')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para marcar entrevista como interrumpida';
    END IF;

    -- Actualizar tabla leads
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason,
        updated_at = now()
    WHERE id = p_lead_id AND interview_session_id = p_session_id;
    
    -- Marcar como interrumpida en proceso de aprobación
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id,
        phone_interview_notes = COALESCE(phone_interview_notes, '') || 
                CASE WHEN phone_interview_notes IS NOT NULL AND phone_interview_notes != '' THEN E'\n\n' ELSE '' END ||
                'Entrevista interrumpida: ' || p_reason,
        updated_at = now()
    WHERE lead_id = p_lead_id;
    
    RETURN true;
END;
$function$;