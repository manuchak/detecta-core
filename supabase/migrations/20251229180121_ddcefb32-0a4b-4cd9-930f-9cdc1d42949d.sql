-- Drop ALL versions of these functions (including old signatures with p_is_test)
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads_v2(TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);

-- Also clean up any duplicate without p_is_test in case there are multiple
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads_v2(TIMESTAMPTZ, TIMESTAMPTZ);

-- Recreate get_analyst_assigned_leads_v2 with correct signature (no p_is_test, using leads table)
CREATE FUNCTION public.get_analyst_assigned_leads_v2(
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
  scheduled_call_datetime timestamp with time zone,
  candidato_custodio_id uuid
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
    l.id as lead_id,
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
    lap.scheduled_call_datetime as scheduled_call_datetime,
    l.candidato_custodio_id as candidato_custodio_id
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  WHERE (
      l.asignado_a = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND l.is_test IS NOT TRUE
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate count_analyst_assigned_leads_v2 with correct signature
CREATE FUNCTION public.count_analyst_assigned_leads_v2(
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
  total_count INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM public.leads l
  WHERE (
      l.asignado_a = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND l.is_test IS NOT TRUE
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to);
  
  RETURN total_count;
END;
$$;