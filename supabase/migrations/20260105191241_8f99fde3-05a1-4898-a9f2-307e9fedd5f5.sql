-- Fix: Remove function ambiguity by dropping all versions and recreating single version
-- Error: "Could not choose the best candidate function" due to duplicate signatures

-- Drop ALL versions of get_analyst_assigned_leads to resolve ambiguity
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(integer, integer, date, date);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(integer, integer, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads();

-- Drop ALL versions of count_analyst_assigned_leads
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads(date, date);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads();

-- Recreate single version of get_analyst_assigned_leads with timestamptz
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  lead_id uuid,
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
  candidato_custodio_id uuid,
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
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get role with priority (for users with multiple roles)
  SELECT ur.role INTO v_user_role
  FROM user_roles ur
  WHERE ur.user_id = v_user_id AND ur.is_active = true
  ORDER BY CASE ur.role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'supply_admin' THEN 3
    ELSE 99
  END
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.nombre as lead_nombre,
    l.email as lead_email,
    l.telefono as lead_telefono,
    l.estado::text as lead_estado,
    l.fecha_creacion as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision as final_decision,
    l.notas as notas,
    lap.scheduled_call_datetime as scheduled_call_datetime,
    l.candidato_custodio_id as candidato_custodio_id,
    l.zona_preferida_id as zona_preferida_id,
    z.nombre as zona_nombre,
    l.fecha_entrada_pool as fecha_entrada_pool,
    l.asignado_a as asignado_a,
    p_analyst.display_name as analista_nombre,
    p_analyst.email as analista_email
  FROM leads l
  LEFT JOIN lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  LEFT JOIN profiles p_analyst ON l.asignado_a = p_analyst.id
  WHERE 
    CASE 
      WHEN v_user_role IN ('admin', 'owner', 'manager', 'supply_admin') THEN 
        l.asignado_a IS NOT NULL
      ELSE 
        l.asignado_a = v_user_id
    END
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to + interval '1 day')
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recreate single version of count_analyst_assigned_leads with timestamptz
CREATE OR REPLACE FUNCTION public.count_analyst_assigned_leads(
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_count integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT ur.role INTO v_user_role
  FROM user_roles ur
  WHERE ur.user_id = v_user_id AND ur.is_active = true
  ORDER BY CASE ur.role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'supply_admin' THEN 3
    ELSE 99
  END
  LIMIT 1;
  
  SELECT COUNT(*)::integer INTO v_count
  FROM leads l
  WHERE 
    CASE 
      WHEN v_user_role IN ('admin', 'owner', 'manager', 'supply_admin') THEN 
        l.asignado_a IS NOT NULL
      ELSE 
        l.asignado_a = v_user_id
    END
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to + interval '1 day');
  
  RETURN v_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads(integer, integer, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_analyst_assigned_leads(timestamptz, timestamptz) TO authenticated;