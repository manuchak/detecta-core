-- Fix get_analyst_assigned_leads_v2: add p_is_test parameter for compatibility with sandbox-aware calls
-- This resolves: "Could not find the function public.get_analyst_assigned_leads_v2(p_date_from, p_date_to, p_is_test, p_limit, p_offset)"

-- First drop the existing function (required when changing parameter signature)
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(integer, integer, timestamptz, timestamptz);

-- Recreate with p_is_test parameter for sandbox compatibility
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE  -- New optional parameter for sandbox mode
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
  candidato_custodio_id uuid,
  zona_preferida_id uuid,
  zona_nombre text,
  fecha_entrada_pool timestamp with time zone,
  asignado_a uuid,
  analista_nombre text,
  analista_email text
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
    cc.id as candidato_custodio_id,
    cc.zona_preferida_id as zona_preferida_id,
    zon.nombre as zona_nombre,
    l.fecha_entrada_pool as fecha_entrada_pool,
    l.asignado_a as asignado_a,
    p.display_name as analista_nombre,
    p.email as analista_email
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.candidatos_custodios cc ON l.id = cc.id::text
  LEFT JOIN public.zonas_operacion_nacional zon ON cc.zona_preferida_id = zon.id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  WHERE (
      l.asignado_a = current_user_id
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = current_user_id 
          AND ur.role IN ('admin', 'owner', 'manager')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.is_test = COALESCE(p_is_test, FALSE)  -- Filter by sandbox mode
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(integer, integer, timestamptz, timestamptz, boolean) TO authenticated;