-- Create function to get analyst assigned leads
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
RETURNS TABLE(
  lead_id text,
  nombre text,
  email text,
  telefono text,
  lead_estado text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  zona_preferida_id uuid,
  zona_nombre text,
  notas jsonb,
  contact_attempts_count integer,
  last_contact_attempt_at timestamp with time zone,
  last_contact_outcome text,
  has_successful_call boolean,
  has_scheduled_call boolean,
  scheduled_call_datetime timestamp with time zone,
  analista_id uuid,
  analista_nombre text,
  analista_email text,
  current_stage text,
  final_decision text,
  phone_interview_completed boolean,
  interview_method text,
  phone_interview_notes text,
  decision_reason text,
  rejection_reason text,
  interview_in_progress boolean,
  interview_started_at timestamp with time zone,
  fecha_entrada_pool timestamp with time zone,
  motivo_pool text
)
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
  
  -- Verificar permisos para acceder a leads de aprobación
  IF NOT (
    public.is_admin_user_secure() OR 
    public.user_has_role_direct('supply_admin') OR 
    public.user_has_role_direct('supply_lead') OR 
    public.user_has_role_direct('ejecutivo_ventas') OR
    public.user_has_role_direct('analista_seguridad') OR
    public.user_has_role_direct('admin') OR
    public.user_has_role_direct('owner')
  ) THEN
    RAISE EXCEPTION 'Sin permisos para acceder a leads de aprobación';
  END IF;
  
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.nombre,
    l.email,
    l.telefono,
    l.estado as lead_estado,
    l.created_at,
    l.updated_at,
    l.zona_preferida_id,
    CAST(NULL AS text) as zona_nombre, -- Placeholder for zone name
    l.notas,
    COALESCE(l.contact_attempts_count, 0) as contact_attempts_count,
    l.last_contact_attempt_at,
    l.last_contact_outcome,
    COALESCE(
      (SELECT COUNT(*) > 0 FROM manual_call_logs mcl 
       WHERE mcl.lead_id = l.id AND mcl.call_outcome = 'successful'), 
      false
    ) as has_successful_call,
    COALESCE(
      (SELECT COUNT(*) > 0 FROM manual_call_logs mcl 
       WHERE mcl.lead_id = l.id 
       AND mcl.call_outcome = 'reschedule_requested' 
       AND mcl.scheduled_datetime > now()), 
      false
    ) as has_scheduled_call,
    (SELECT mcl.scheduled_datetime FROM manual_call_logs mcl 
     WHERE mcl.lead_id = l.id 
     AND mcl.call_outcome = 'reschedule_requested' 
     AND mcl.scheduled_datetime > now()
     ORDER BY mcl.created_at DESC 
     LIMIT 1) as scheduled_call_datetime,
    l.asignado_a as analista_id,
    p.display_name as analista_nombre,
    p.email as analista_email,
    COALESCE(lap.current_stage, 'phone_interview') as current_stage,
    lap.final_decision,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.interview_method, 'manual') as interview_method,
    lap.phone_interview_notes,
    lap.decision_reason,
    lap.rejection_reason,
    COALESCE(l.interview_in_progress, false) as interview_in_progress,
    l.interview_started_at,
    l.fecha_entrada_pool,
    l.motivo_pool
  FROM leads l
  LEFT JOIN profiles p ON l.asignado_a = p.id
  LEFT JOIN lead_approval_process lap ON l.id = lap.lead_id
  WHERE l.asignado_a = current_user_id
    AND l.estado IN ('nuevo', 'en_proceso', 'pendiente_aprobacion')
  ORDER BY l.created_at DESC;
END;
$$;