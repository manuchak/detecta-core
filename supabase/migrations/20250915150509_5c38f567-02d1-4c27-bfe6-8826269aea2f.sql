-- Corrección del bug de approval_stage en funciones RPC
-- Las funciones están usando 'approval_stage' pero la columna real es 'current_stage'

-- Función para actualizar el proceso de aprobación (CORREGIDA)
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
  
  -- Verificar permisos explícitamente para roles autorizados
  IF NOT (
    is_admin_user_secure() OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('supply_lead') OR 
    user_has_role_direct('ejecutivo_ventas')
  ) THEN
    RAISE EXCEPTION 'Sin permisos para actualizar proceso de aprobación';
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
    p_lead_id::uuid,
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

-- Función para guardar sesión de entrevista (CORREGIDA)
CREATE OR REPLACE FUNCTION public.save_interview_session(p_lead_id text, p_session_id uuid, p_interview_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificación explícita de permisos para roles autorizados
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para guardar sesión de entrevista';
    END IF;

    -- Actualizar tabla leads con datos de entrevista
    UPDATE public.leads 
    SET 
        interview_data = COALESCE(interview_data, '{}'::jsonb) || p_interview_data,
        interview_session_id = p_session_id,
        updated_at = now()
    WHERE id::text = p_lead_id::text;
    
    -- Actualizar o crear registro del proceso de aprobación
    INSERT INTO public.lead_approval_process (
        lead_id,
        analyst_id,
        current_stage,
        last_session_id,
        updated_at
    )
    VALUES (
        p_lead_id::uuid,
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
$$;

-- Función para marcar entrevista como interrumpida (CORREGIDA)
CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(p_lead_id text, p_session_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Verificación explícita de permisos para roles autorizados  
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para marcar entrevista como interrumpida';
    END IF;

    -- Actualizar tabla leads
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason,
        updated_at = now()
    WHERE id::text = p_lead_id::text AND interview_session_id = p_session_id;
    
    -- Marcar como interrumpida en proceso de aprobación
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id,
        phone_interview_notes = COALESCE(phone_interview_notes, '') || 
                CASE WHEN phone_interview_notes IS NOT NULL AND phone_interview_notes != '' THEN E'\n\n' ELSE '' END ||
                'Entrevista interrumpida: ' || p_reason,
        updated_at = now()
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;