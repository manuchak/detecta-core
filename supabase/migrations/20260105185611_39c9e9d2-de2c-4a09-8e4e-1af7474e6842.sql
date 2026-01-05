-- Update get_analyst_assigned_leads to include analyst information (asignado_a, analista_nombre, analista_email)
-- This allows supply_admin to see who is assigned to each lead and filter by analyst

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
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
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get user role
  SELECT ur.role INTO v_user_role
  FROM user_roles ur
  WHERE ur.user_id = v_user_id
  LIMIT 1;
  
  -- Return leads based on role
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
    -- NEW: Include analyst info
    l.asignado_a as asignado_a,
    p_analyst.display_name as analista_nombre,
    p_analyst.email as analista_email
  FROM leads l
  LEFT JOIN lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  LEFT JOIN profiles p_analyst ON l.asignado_a = p_analyst.id
  WHERE 
    -- Visibility rules by role
    CASE 
      WHEN v_user_role IN ('admin', 'owner', 'manager', 'supply_admin') THEN 
        l.asignado_a IS NOT NULL  -- Supervisors see all assigned leads
      ELSE 
        l.asignado_a = v_user_id  -- Regular users see only their own
    END
    -- Date filters
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to + interval '1 day')
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;