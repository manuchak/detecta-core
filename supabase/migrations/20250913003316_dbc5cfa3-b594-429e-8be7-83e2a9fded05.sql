-- Actualizar función save_interview_progress para incluir verificación de permisos para supply_lead
CREATE OR REPLACE FUNCTION public.save_interview_progress(
    p_lead_id TEXT,
    p_session_id UUID,
    p_interview_data JSONB,
    p_autosave BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el usuario tiene permisos para trabajar con leads
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin'::text) OR 
        user_has_role_direct('supply_lead'::text) OR 
        user_has_role_direct('ejecutivo_ventas'::text)
    ) THEN
        RAISE EXCEPTION 'Sin permisos para guardar progreso de entrevista';
    END IF;

    -- Actualizar los datos de entrevista en la tabla leads
    UPDATE public.leads 
    SET 
        last_interview_data = p_interview_data,
        interview_session_id = p_session_id,
        last_autosave_at = CASE WHEN p_autosave THEN now() ELSE last_autosave_at END
    WHERE id = p_lead_id;
    
    -- También actualizar el proceso de aprobación si existe
    UPDATE public.lead_approval_process
    SET 
        last_session_id = p_session_id
    WHERE lead_id = p_lead_id;
    
    RETURN true;
END;
$$;

-- Actualizar función mark_interview_interrupted para incluir verificación de permisos para supply_lead
CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(
    p_lead_id TEXT,
    p_session_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el usuario tiene permisos para trabajar con leads
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin'::text) OR 
        user_has_role_direct('supply_lead'::text) OR 
        user_has_role_direct('ejecutivo_ventas'::text)
    ) THEN
        RAISE EXCEPTION 'Sin permisos para marcar entrevista como interrumpida';
    END IF;

    -- Actualizar la tabla leads
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason
    WHERE id = p_lead_id AND interview_session_id = p_session_id;
    
    -- Marcar como interrumpida en el proceso de aprobación
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id
    WHERE lead_id = p_lead_id;
    
    RETURN true;
END;
$$;