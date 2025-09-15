-- Fix interview workflow permissions for supply_admin and supply_lead roles

-- 1. Update RLS policy for lead_approval_process to include supply_lead
-- First drop the existing policy
DROP POLICY IF EXISTS "Allow authorized users to update lead approval process" ON public.lead_approval_process;

-- Create updated policy that includes supply_lead consistently with leads table
CREATE POLICY "Allow authorized users to update lead approval process"
ON public.lead_approval_process
FOR ALL
TO authenticated
USING (
    -- Allow access for admin, owner, supply_admin, supply_lead, ejecutivo_ventas
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
    )
);

-- 2. Update the update_approval_process function to include explicit permission validation
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
BEGIN
    -- Explicit permission check for authorized roles
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para actualizar el proceso de aprobación';
    END IF;

    -- Insert or update the lead approval process
    INSERT INTO public.lead_approval_process (
        lead_id, 
        approval_stage, 
        interview_method, 
        notes, 
        final_decision, 
        decision_reason,
        updated_at
    )
    VALUES (
        p_lead_id::uuid, 
        p_stage, 
        p_interview_method, 
        p_notes, 
        p_decision, 
        p_decision_reason,
        now()
    )
    ON CONFLICT (lead_id) 
    DO UPDATE SET
        approval_stage = EXCLUDED.approval_stage,
        interview_method = COALESCE(EXCLUDED.interview_method, lead_approval_process.interview_method),
        notes = COALESCE(EXCLUDED.notes, lead_approval_process.notes),
        final_decision = COALESCE(EXCLUDED.final_decision, lead_approval_process.final_decision),
        decision_reason = COALESCE(EXCLUDED.decision_reason, lead_approval_process.decision_reason),
        updated_at = now();
END;
$$;

-- 3. Update mark_interview_interrupted function to ensure consistent permissions
CREATE OR REPLACE FUNCTION public.mark_interview_interrupted(p_lead_id text, p_session_id uuid, p_reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Explicit permission check for authorized roles (same as update_approval_process)
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para marcar entrevista como interrumpida';
    END IF;

    -- Update leads table
    UPDATE public.leads 
    SET 
        interruption_reason = p_reason,
        updated_at = now()
    WHERE id::text = p_lead_id::text AND interview_session_id = p_session_id;
    
    -- Mark as interrupted in approval process
    UPDATE public.lead_approval_process
    SET 
        interview_interrupted = true,
        last_session_id = p_session_id,
        notes = COALESCE(notes, '') || 
                CASE WHEN notes IS NOT NULL AND notes != '' THEN E'\n\n' ELSE '' END ||
                'Entrevista interrumpida: ' || p_reason,
        updated_at = now()
    WHERE lead_id::text = p_lead_id::text;
    
    RETURN true;
END;
$$;

-- 4. Ensure save_interview_session function has consistent permissions  
CREATE OR REPLACE FUNCTION public.save_interview_session(p_lead_id text, p_session_id uuid, p_interview_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Explicit permission check for authorized roles
    IF NOT (
        is_admin_user_secure() OR 
        user_has_role_direct('supply_admin') OR 
        user_has_role_direct('supply_lead') OR 
        user_has_role_direct('ejecutivo_ventas')
    ) THEN
        RAISE EXCEPTION 'Sin permisos para guardar sesión de entrevista';
    END IF;

    -- Update leads table with interview data
    UPDATE public.leads 
    SET 
        interview_data = COALESCE(interview_data, '{}'::jsonb) || p_interview_data,
        interview_session_id = p_session_id,
        updated_at = now()
    WHERE id::text = p_lead_id::text;
    
    -- Update or create approval process record
    INSERT INTO public.lead_approval_process (
        lead_id,
        approval_stage,
        last_session_id,
        updated_at
    )
    VALUES (
        p_lead_id::uuid,
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