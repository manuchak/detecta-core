-- =============================================
-- FIX: supply_lead visibility - only see their own assigned leads
-- Must DROP functions first due to return type changes
-- =============================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(integer, integer, timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(integer, integer, timestamp with time zone, timestamp with time zone, boolean);

-- Recreate get_analyst_assigned_leads with correct visibility
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_date_from timestamp with time zone DEFAULT NULL,
  p_date_to timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  lead_id text,
  nombre text,
  telefono text,
  email text,
  zona_nombre text,
  created_at timestamp with time zone,
  estado_proceso text,
  analista_id uuid,
  analista_nombre text,
  current_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  decision_reason text,
  approval_notes text,
  approval_updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_can_see_all boolean := false;
BEGIN
  -- Check if user has admin/owner/supply_admin role (can see all)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_can_see_all;

  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre,
    l.telefono,
    l.email,
    COALESCE(z.nombre, 'Sin zona')::text as zona_nombre,
    l.created_at,
    l.estado_proceso,
    l.asignado_a as analista_id,
    COALESCE(p.display_name, p.email, 'Sin asignar')::text as analista_nombre,
    COALESCE(lap.current_stage, 'pending_contact') as current_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    lap.decision_reason,
    lap.notes as approval_notes,
    lap.updated_at as approval_updated_at
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON lap.lead_id = l.id
  LEFT JOIN public.zonas_operacion_nacional z ON z.id = l.zona_preferida_id
  LEFT JOIN public.profiles p ON p.id = l.asignado_a
  WHERE 
    l.asignado_a IS NOT NULL
    AND l.fecha_entrada_pool IS NULL
    AND (
      user_can_see_all = true
      OR l.asignado_a = current_user_id
    )
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate count_analyst_assigned_leads with same visibility logic
CREATE OR REPLACE FUNCTION public.count_analyst_assigned_leads(
  p_date_from timestamp with time zone DEFAULT NULL,
  p_date_to timestamp with time zone DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_can_see_all boolean := false;
  total_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_can_see_all;

  SELECT COUNT(*)::integer INTO total_count
  FROM public.leads l
  WHERE 
    l.asignado_a IS NOT NULL
    AND l.fecha_entrada_pool IS NULL
    AND (
      user_can_see_all = true
      OR l.asignado_a = current_user_id
    )
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to);

  RETURN total_count;
END;
$$;

-- Recreate _v2 version with same logic
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_date_from timestamp with time zone DEFAULT NULL,
  p_date_to timestamp with time zone DEFAULT NULL,
  p_is_test boolean DEFAULT NULL
)
RETURNS TABLE (
  lead_id text,
  nombre text,
  telefono text,
  email text,
  zona_nombre text,
  created_at timestamp with time zone,
  estado_proceso text,
  analista_id uuid,
  analista_nombre text,
  current_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  decision_reason text,
  approval_notes text,
  approval_updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_can_see_all boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_can_see_all;

  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre,
    l.telefono,
    l.email,
    COALESCE(z.nombre, 'Sin zona')::text as zona_nombre,
    l.created_at,
    l.estado_proceso,
    l.asignado_a as analista_id,
    COALESCE(p.display_name, p.email, 'Sin asignar')::text as analista_nombre,
    COALESCE(lap.current_stage, 'pending_contact') as current_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    lap.decision_reason,
    lap.notes as approval_notes,
    lap.updated_at as approval_updated_at
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON lap.lead_id = l.id
  LEFT JOIN public.zonas_operacion_nacional z ON z.id = l.zona_preferida_id
  LEFT JOIN public.profiles p ON p.id = l.asignado_a
  WHERE 
    l.asignado_a IS NOT NULL
    AND l.fecha_entrada_pool IS NULL
    AND (
      user_can_see_all = true
      OR l.asignado_a = current_user_id
    )
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
    AND (p_is_test IS NULL OR l.is_test = p_is_test)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_analyst_assigned_leads TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2 TO authenticated;