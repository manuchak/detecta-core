-- Fix search_path for the functions we just created
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
SET search_path = 'public'
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
      (SELECT COUNT(*) > 0 FROM public.manual_call_logs mcl 
       WHERE mcl.lead_id = l.id AND mcl.call_outcome = 'successful'), 
      false
    ) as has_successful_call,
    COALESCE(
      (SELECT COUNT(*) > 0 FROM public.manual_call_logs mcl 
       WHERE mcl.lead_id = l.id 
       AND mcl.call_outcome = 'reschedule_requested' 
       AND mcl.scheduled_datetime > now()), 
      false
    ) as has_scheduled_call,
    (SELECT mcl.scheduled_datetime FROM public.manual_call_logs mcl 
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
  FROM public.leads l
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  WHERE l.asignado_a = current_user_id
    AND l.estado IN ('nuevo', 'en_proceso', 'pendiente_aprobacion')
  ORDER BY l.created_at DESC;
END;
$$;

-- Fix search_path for update_approval_process function  
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
SET search_path = 'public'
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