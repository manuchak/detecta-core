-- Actualizar función para que admins vean todos los candidatos asignados
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads();

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
RETURNS TABLE(
    lead_id TEXT,
    lead_nombre TEXT,
    lead_email TEXT,
    lead_telefono TEXT,
    lead_fecha_creacion TIMESTAMP WITH TIME ZONE,
    lead_estado TEXT,
    zona_preferida_id UUID,
    zona_nombre TEXT,
    asignado_a UUID,
    analista_nombre TEXT,
    analista_email TEXT,
    fecha_asignacion TIMESTAMP WITH TIME ZONE,
    contact_attempts_count INTEGER,
    last_contact_outcome TEXT,
    has_successful_call BOOLEAN,
    scheduled_call_datetime TIMESTAMP WITH TIME ZONE,
    has_scheduled_call BOOLEAN,
    interview_interrupted BOOLEAN,
    interview_session_id TEXT,
    final_decision TEXT,
    fecha_entrada_pool TIMESTAMP WITH TIME ZONE,
    motivo_pool TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- Obtener el usuario actual
    current_user_id := auth.uid();
    
    -- Verificar que el usuario está autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Verificar si el usuario es administrador
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = current_user_id 
        AND role IN ('admin', 'owner', 'manager')
    ) INTO is_admin;
    
    -- Log para debugging
    RAISE NOTICE 'Usuario autenticado: %, Es admin: %', current_user_id, is_admin;
    
    -- Devolver leads según los permisos del usuario
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
        l.fecha_asignacion,
        COALESCE(mcl.contact_attempts, 0)::INTEGER as contact_attempts_count,
        mcl.last_outcome as last_contact_outcome,
        COALESCE(mcl.has_successful, false) as has_successful_call,
        mcl.next_scheduled as scheduled_call_datetime,
        (mcl.next_scheduled IS NOT NULL AND mcl.next_scheduled > NOW()) as has_scheduled_call,
        COALESCE(lap.interview_interrupted, false) as interview_interrupted,
        lap.interview_session_id,
        lap.final_decision,
        l.fecha_entrada_pool,
        l.motivo_pool
    FROM leads l
    LEFT JOIN zonas_operacion_nacional z ON l.zona_preferida_id = z.id
    LEFT JOIN profiles p ON l.asignado_a = p.id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as contact_attempts,
            MAX(call_outcome) as last_outcome,
            BOOL_OR(call_outcome = 'successful') as has_successful,
            MAX(scheduled_datetime) FILTER (WHERE call_outcome = 'reschedule_requested') as next_scheduled
        FROM manual_call_logs 
        WHERE lead_id = l.id
    ) mcl ON true
    LEFT JOIN lead_approval_process lap ON lap.lead_id = l.id
    WHERE (
        -- Si es admin, ver todos los leads asignados
        (is_admin AND l.asignado_a IS NOT NULL)
        OR 
        -- Si no es admin, solo sus propios leads
        (NOT is_admin AND l.asignado_a = current_user_id)
    )
    AND l.estado NOT IN ('rechazado') -- Excluir leads rechazados solamente
    AND l.fecha_entrada_pool IS NULL  -- Excluir leads en pool de reserva
    ORDER BY 
        -- Prioridad para entrevistas interrumpidas
        CASE WHEN lap.interview_interrupted = true THEN 1 ELSE 2 END,
        -- Prioridad para citas programadas próximas
        CASE WHEN mcl.next_scheduled IS NOT NULL AND mcl.next_scheduled <= NOW() + INTERVAL '1 hour' THEN 1 ELSE 2 END,
        -- Orden por fecha de creación (más antiguos primero)
        l.fecha_creacion ASC;
END;
$$;