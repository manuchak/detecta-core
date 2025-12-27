-- Agregar la columna scheduled_call_datetime que falta en lead_approval_process
ALTER TABLE public.lead_approval_process 
ADD COLUMN IF NOT EXISTS scheduled_call_datetime TIMESTAMPTZ;

-- Agregar comentario para documentar el propósito
COMMENT ON COLUMN public.lead_approval_process.scheduled_call_datetime IS 
'Fecha y hora programada para la próxima llamada al candidato';

-- Primero eliminar las funciones existentes para poder recrearlas con nuevo return type
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN);

-- Recrear get_analyst_assigned_leads con scheduled_call_datetime incluido
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
  scheduled_call_datetime timestamp with time zone
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
    l.estado_proceso as lead_estado,
    l.created_at as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas_recruiter as notas,
    lap.scheduled_call_datetime as scheduled_call_datetime
  FROM public.candidatos_custodios l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.leads_asignados_analistas laa ON l.id = laa.lead_id AND laa.activo = true
  WHERE (
      laa.analista_id = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
        )
        AND laa.analista_id IS NOT NULL
      )
    )
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Recrear get_analyst_assigned_leads_v2 con scheduled_call_datetime incluido
CREATE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT false
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
  scheduled_call_datetime timestamp with time zone
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
    l.estado_proceso as lead_estado,
    l.created_at as lead_fecha_creacion,
    COALESCE(lap.current_stage, 'phone_interview') as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text as final_decision,
    l.notas_recruiter as notas,
    lap.scheduled_call_datetime as scheduled_call_datetime
  FROM public.candidatos_custodios l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.leads_asignados_analistas laa ON l.id = laa.lead_id AND laa.activo = true
  WHERE (
      laa.analista_id = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin')
        )
        AND laa.analista_id IS NOT NULL
      )
    )
    AND l.is_test = p_is_test
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;