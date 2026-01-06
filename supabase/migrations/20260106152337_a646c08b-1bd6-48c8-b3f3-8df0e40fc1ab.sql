-- FIX: Column l.estado_proceso does not exist in leads table - use l.estado instead
-- The leads table has 'estado' not 'estado_proceso' (that column is in candidatos_custodios)

-- Drop all versions first to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads(TIMESTAMPTZ, TIMESTAMPTZ);

-- Recreate get_analyst_assigned_leads with correct column reference
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
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
  zona_nombre text,
  analista_nombre text,
  estado_proceso text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_is_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Check if user has admin-level visibility
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_is_admin;
  
  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas as notas,
    z.nombre::text as zona_nombre,
    p.display_name::text as analista_nombre,
    l.estado::text as estado_proceso  -- FIX: Use l.estado instead of l.estado_proceso
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  WHERE (
      -- supply_lead and ejecutivo_ventas only see their own leads
      l.asignado_a = current_user_id
      OR (
        -- admin, owner, supply_admin see all assigned leads
        user_is_admin = true
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate count function with same visibility logic
CREATE OR REPLACE FUNCTION public.count_analyst_assigned_leads(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_is_admin boolean;
  total_count INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_is_admin;
  
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM public.leads l
  WHERE (
      l.asignado_a = current_user_id
      OR (
        user_is_admin = true
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to);
  
  RETURN total_count;
END;
$$;

-- Recreate v2 version for sandbox compatibility
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT NULL
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
  zona_nombre text,
  analista_nombre text,
  estado_proceso text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_is_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'supply_admin')
  ) INTO user_is_admin;
  
  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas as notas,
    z.nombre::text as zona_nombre,
    p.display_name::text as analista_nombre,
    l.estado::text as estado_proceso  -- FIX: Use l.estado instead of l.estado_proceso
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  WHERE (
      l.asignado_a = current_user_id
      OR (
        user_is_admin = true
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
    AND (p_is_test IS NULL OR l.is_test = p_is_test)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_analyst_assigned_leads(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO authenticated;