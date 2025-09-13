-- Secure and fix interview RPCs (cast id properly and allow supply_lead); set search_path
CREATE OR REPLACE FUNCTION public.save_interview_progress(
    p_lead_id TEXT,
    p_session_id UUID,
    p_interview_data JSONB,
    p_autosave BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Permisos: admins, supply_admin, supply_lead, ejecutivo_ventas
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para guardar progreso de entrevista';
    END IF;

    -- Actualizar leads (id es UUID): comparar como texto para evitar errores de tipo
    UPDATE public.leads 
    SET 
        last_interview_data = p_interview_data,
        interview_session_id = p_session_id,
        last_autosave_at = CASE WHEN p_autosave THEN now() ELSE last_autosave_at END
    WHERE id::text = p_lead_id::text;
    
    -- Actualizar proceso de aprobación (lead_id puede ser texto)
    UPDATE public.lead_approval_process
    SET 
        last_session_id = p_session_id
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(
    p_lead_id TEXT,
    p_session_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Permisos: admins, supply_admin, supply_lead, ejecutivo_ventas
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para marcar entrevista como interrumpida';
    END IF;

    -- Actualizar leads
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason
    WHERE id::text = p_lead_id::text AND interview_session_id = p_session_id;
    
    -- Marcar como interrumpida en el proceso de aprobación
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;