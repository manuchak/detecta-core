-- Fix: Remove reference to non-existent lead_call_logs table
-- Restore proper RPC contract compatible with frontend

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(int, int, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(int, int, timestamptz, timestamptz, boolean);

-- Recreate get_analyst_assigned_leads WITHOUT lead_call_logs reference
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamptz,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  scheduled_call_datetime timestamptz,
  candidato_custodio_id text,
  zona_preferida_id uuid,
  zona_nombre text,
  fecha_entrada_pool timestamptz,
  asignado_a uuid,
  analista_nombre text,
  analista_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_has_admin_role boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user has elevated role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
  ) INTO user_has_admin_role;
  
  RETURN QUERY
  SELECT
    l.id::text as lead_id,
    l.nombre::text as lead_nombre,
    l.email::text as lead_email,
    l.telefono::text as lead_telefono,
    l.estado::text as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview')::text as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas::text as notas,
    lap.scheduled_call_datetime as scheduled_call_datetime,
    cc.id::text as candidato_custodio_id,
    l.zona_preferida_id as zona_preferida_id,
    zon.nombre::text as zona_nombre,
    l.fecha_entrada_pool as fecha_entrada_pool,
    l.asignado_a as asignado_a,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.candidatos_custodios cc ON l.id = cc.id::text
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_preferida_id = zon.id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  WHERE (
      l.asignado_a = current_user_id
      OR user_has_admin_role
    )
    AND l.asignado_a IS NOT NULL
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate get_analyst_assigned_leads_v2 with sandbox support
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_is_test boolean DEFAULT false
)
RETURNS TABLE (
  lead_id text,
  lead_nombre text,
  lead_email text,
  lead_telefono text,
  lead_estado text,
  lead_fecha_creacion timestamptz,
  approval_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  scheduled_call_datetime timestamptz,
  candidato_custodio_id text,
  zona_preferida_id uuid,
  zona_nombre text,
  fecha_entrada_pool timestamptz,
  asignado_a uuid,
  analista_nombre text,
  analista_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_has_admin_role boolean;
BEGIN
  current_user_id := auth.uid();
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
  ) INTO user_has_admin_role;
  
  RETURN QUERY
  SELECT
    l.id::text as lead_id,
    l.nombre::text as lead_nombre,
    l.email::text as lead_email,
    l.telefono::text as lead_telefono,
    l.estado::text as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview')::text as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas::text as notas,
    lap.scheduled_call_datetime as scheduled_call_datetime,
    cc.id::text as candidato_custodio_id,
    l.zona_preferida_id as zona_preferida_id,
    zon.nombre::text as zona_nombre,
    l.fecha_entrada_pool as fecha_entrada_pool,
    l.asignado_a as asignado_a,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.candidatos_custodios cc ON l.id = cc.id::text
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_preferida_id = zon.id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  WHERE (
      l.asignado_a = current_user_id
      OR user_has_admin_role
    )
    AND l.asignado_a IS NOT NULL
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
    AND (l.is_test = p_is_test OR (l.is_test IS NULL AND p_is_test = false))
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads(int, int, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(int, int, timestamptz, timestamptz, boolean) TO authenticated;