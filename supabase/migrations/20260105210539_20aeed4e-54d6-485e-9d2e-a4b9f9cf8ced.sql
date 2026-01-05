-- Fix error 42804: Drop and recreate functions with correct column casts

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);

-- Recreate get_analyst_assigned_leads (v1) with proper casts
CREATE FUNCTION public.get_analyst_assigned_leads(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
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
  final_decision text,
  notas text,
  asignado_a uuid,
  analista_nombre text,
  analista_email text,
  zona_nombre text
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
    l.asignado_a as asignado_a,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email,
    zon.nombre::text as zona_nombre
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_id = zon.id
  WHERE (
      l.asignado_a = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate get_analyst_assigned_leads_v2 with proper casts
CREATE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE
)
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
  final_decision text,
  notas text,
  asignado_a uuid,
  analista_nombre text,
  analista_email text,
  zona_nombre text
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
    l.asignado_a as asignado_a,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email,
    zon.nombre::text as zona_nombre
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_id = zon.id
  WHERE (
      l.asignado_a = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND l.is_test = COALESCE(p_is_test, FALSE)
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO authenticated;