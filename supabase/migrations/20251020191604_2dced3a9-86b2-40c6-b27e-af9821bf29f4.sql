-- Actualizar get_analyst_assigned_leads_v2 con soporte para paginación
-- Esta es la función que realmente se usa gracias al wrapper de Sandbox

DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(boolean);

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  lead_id text,
  nombre text,
  email text,
  telefono text,
  empresa text,
  mensaje text,
  fuente text,
  fecha_creacion timestamp with time zone,
  lead_estado text,
  asignado_a text,
  zona_preferida_id text,
  zona_nombre text,
  credenciales_enviadas boolean,
  current_stage text,
  phone_interview_completed boolean,
  second_interview_required boolean,
  final_decision text,
  notas text,
  analista_id text,
  analista_nombre text,
  analista_email text,
  has_successful_call boolean,
  has_scheduled_call boolean,
  scheduled_call_datetime timestamp with time zone,
  contact_attempts_count integer,
  last_contact_outcome text,
  last_contact_date timestamp with time zone,
  interview_interrupted boolean,
  interview_session_id text,
  interview_in_progress boolean,
  interview_started_at timestamp with time zone,
  fecha_entrada_pool timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar si el usuario es admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  ) INTO is_admin;
  
  RETURN QUERY
  SELECT 
    l.id::text as lead_id,
    l.nombre,
    l.email,
    l.telefono,
    l.empresa,
    l.mensaje,
    l.fuente,
    l.fecha_creacion,
    l.estado as lead_estado,
    l.asignado_a::text,
    l.zona_preferida_id::text,
    COALESCE(z.nombre, 'Sin zona')::text as zona_nombre,
    COALESCE(l.credenciales_enviadas, false) as credenciales_enviadas,
    COALESCE(lap.current_stage, 'phone_interview')::text as current_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    lap.final_decision::text,
    l.notas,
    lap.analyst_id::text as analista_id,
    p.display_name as analista_nombre,
    p.email as analista_email,
    COALESCE(lap.phone_interview_completed, false) as has_successful_call,
    CASE 
      WHEN sc.id IS NOT NULL AND sc.status IN ('pending', 'scheduled') THEN true
      ELSE false
    END as has_scheduled_call,
    sc.scheduled_datetime as scheduled_call_datetime,
    COALESCE((
      SELECT COUNT(*)::integer 
      FROM public.call_logs cl 
      WHERE cl.lead_id = l.id
    ), 0) as contact_attempts_count,
    (
      SELECT cl.outcome 
      FROM public.call_logs cl 
      WHERE cl.lead_id = l.id 
      ORDER BY cl.created_at DESC 
      LIMIT 1
    ) as last_contact_outcome,
    (
      SELECT cl.created_at 
      FROM public.call_logs cl 
      WHERE cl.lead_id = l.id 
      ORDER BY cl.created_at DESC 
      LIMIT 1
    ) as last_contact_date,
    COALESCE(l.interview_interrupted, false) as interview_interrupted,
    l.interview_session_id,
    COALESCE(l.interview_in_progress, false) as interview_in_progress,
    l.interview_started_at,
    l.fecha_entrada_pool
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON lap.analyst_id = p.id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  LEFT JOIN public.scheduled_calls sc ON l.id = sc.lead_id 
    AND sc.status IN ('pending', 'scheduled')
  WHERE l.is_test = p_is_test
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
    AND (
      (NOT is_admin AND l.asignado_a = current_user_id)
      OR (is_admin AND l.asignado_a IS NOT NULL)
    )
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN, INTEGER, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_analyst_assigned_leads_v2 IS 'Versión Sandbox-aware con paginación - filtra leads por ambiente (is_test) y fecha';

-- Actualizar count_analyst_assigned_leads para soportar is_test también
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads_v2(boolean);
DROP FUNCTION IF EXISTS public.count_analyst_assigned_leads_v2(timestamptz, timestamptz, boolean);

CREATE OR REPLACE FUNCTION public.count_analyst_assigned_leads_v2(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_is_test BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
  total_count INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Verificar si el usuario es admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  ) INTO is_admin;
  
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM public.leads l
  WHERE l.is_test = p_is_test
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
    AND (
      (NOT is_admin AND l.asignado_a = current_user_id)
      OR (is_admin AND l.asignado_a IS NOT NULL)
    );
  
  RETURN total_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_analyst_assigned_leads_v2(TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO authenticated;
COMMENT ON FUNCTION public.count_analyst_assigned_leads_v2 IS 'Cuenta leads asignados filtrados por ambiente (is_test) y fecha';