-- ============================================================================
-- ACTUALIZAR FUNCIÓN RPC: Incluir candidato_custodio_id en get_analyst_assigned_leads
-- ============================================================================

-- PASO 1: Eliminar TODAS las versiones de la función
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(); -- Versión sin parámetros
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(integer, integer, timestamp with time zone, timestamp with time zone); -- Versión con parámetros

-- PASO 2: Recrear SOLO la versión con parámetros, incluyendo el nuevo campo
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
    p_limit integer DEFAULT 50, 
    p_offset integer DEFAULT 0, 
    p_date_from timestamp with time zone DEFAULT NULL, 
    p_date_to timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
    lead_id text, 
    lead_nombre text, 
    lead_email text, 
    lead_telefono text, 
    lead_fecha_creacion timestamp with time zone, 
    lead_estado text, 
    zona_preferida_id uuid, 
    zona_nombre character varying, 
    asignado_a uuid, 
    analista_nombre text, 
    analista_email text, 
    contact_attempts_count integer, 
    last_contact_outcome text, 
    has_successful_call boolean, 
    scheduled_call_datetime timestamp with time zone, 
    has_scheduled_call boolean, 
    interview_interrupted boolean, 
    interview_session_id text, 
    final_decision text, 
    fecha_entrada_pool timestamp with time zone, 
    motivo_pool text, 
    interview_in_progress boolean, 
    interview_started_at timestamp with time zone,
    candidato_custodio_id uuid  -- 🔗 NUEVO CAMPO
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = current_user_id 
        AND role IN ('admin', 'owner', 'manager')
    ) INTO is_admin;
    
    RETURN QUERY
    SELECT 
        l.id::TEXT as lead_id,
        l.nombre as lead_nombre,
        l.email as lead_email,
        l.telefono as lead_telefono,
        l.fecha_creacion as lead_fecha_creacion,
        l.estado as lead_estado,
        l.zona_preferida_id,
        z.nombre as zona_nombre,
        l.asignado_a,
        p.display_name as analista_nombre,
        p.email as analista_email,
        COALESCE(mcl.contact_attempts, 0)::INTEGER as contact_attempts_count,
        mcl.last_outcome as last_contact_outcome,
        COALESCE(mcl.has_successful, false) as has_successful_call,
        mcl.next_scheduled as scheduled_call_datetime,
        (mcl.next_scheduled IS NOT NULL AND mcl.next_scheduled > NOW()) as has_scheduled_call,
        COALESCE(l.interruption_reason IS NOT NULL, false) as interview_interrupted,
        l.interview_session_id::TEXT as interview_session_id,
        lap.final_decision,
        l.fecha_entrada_pool,
        l.motivo_pool,
        COALESCE(l.interview_in_progress, false) as interview_in_progress,
        l.interview_started_at,
        l.candidato_custodio_id  -- 🔗 INCLUIR NUEVO CAMPO
    FROM leads l
    LEFT JOIN zonas_operacion_nacional z ON l.zona_preferida_id = z.id
    LEFT JOIN profiles p ON l.asignado_a = p.id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as contact_attempts,
            MAX(mcl_inner.call_outcome) as last_outcome,
            BOOL_OR(mcl_inner.call_outcome = 'successful') as has_successful,
            MAX(mcl_inner.scheduled_datetime) FILTER (WHERE mcl_inner.call_outcome = 'reschedule_requested') as next_scheduled
        FROM manual_call_logs mcl_inner
        WHERE mcl_inner.lead_id = l.id
    ) mcl ON true
    LEFT JOIN lead_approval_process lap ON lap.lead_id = l.id
    WHERE (
        (is_admin AND l.asignado_a IS NOT NULL)
        OR 
        (NOT is_admin AND l.asignado_a = current_user_id)
    )
    AND l.estado NOT IN ('rechazado')
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
    ORDER BY 
        CASE WHEN l.interview_in_progress = true THEN 1 ELSE 2 END,
        CASE WHEN l.fecha_entrada_pool IS NULL THEN 1 ELSE 2 END,
        CASE WHEN l.interruption_reason IS NOT NULL THEN 1 ELSE 2 END,
        CASE WHEN mcl.next_scheduled IS NOT NULL AND mcl.next_scheduled <= NOW() + INTERVAL '1 hour' THEN 1 ELSE 2 END,
        l.fecha_creacion ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- PASO 3: Dar permisos
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads TO authenticated;