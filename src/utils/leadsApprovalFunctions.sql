
-- Función para obtener leads asignados al analista actual con información del proceso de aprobación
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
RETURNS TABLE(
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamp with time zone,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text
)
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
  
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  WHERE l.asignado_a = current_user_id
    OR (
      -- También permitir a administradores ver todos los leads asignados
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = current_user_id 
        AND ur.role IN ('admin', 'owner', 'manager')
      )
      AND l.asignado_a IS NOT NULL
    )
  ORDER BY l.fecha_creacion DESC;
END;
$$;

-- Función para actualizar el proceso de aprobación
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
    p_lead_id,
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

-- Función para obtener usuarios con roles específicos (usada en LeadAssignmentDialog)
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar que el usuario actual es administrador
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
  ORDER BY p.display_name;
END;
$$;
