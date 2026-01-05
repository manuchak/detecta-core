-- Fix: Change l.zona_id to l.zona_preferida_id (correct column name)
-- The leads table uses zona_preferida_id, not zona_id

-- Drop and recreate get_analyst_assigned_leads with correct column reference
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads(int, int, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  lead_id text,
  nombre text,
  email text,
  telefono text,
  estado text,
  created_at timestamptz,
  current_stage text,
  final_decision text,
  notas text,
  analista_id uuid,
  analista_nombre text,
  analista_email text,
  total_llamadas bigint,
  zona_nombre text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id::text as lead_id,
    l.nombre::text as nombre,
    l.email::text as email,
    l.telefono::text as telefono,
    l.estado::text as estado,
    l.created_at,
    lap.current_stage::text as current_stage,
    lap.final_decision::text as final_decision,
    l.notas::text as notas,
    p.id as analista_id,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email,
    COALESCE(call_counts.total, 0) as total_llamadas,
    zon.nombre::text as zona_nombre
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_preferida_id = zon.id
  LEFT JOIN (
    SELECT lead_id, COUNT(*) as total
    FROM public.lead_call_logs
    GROUP BY lead_id
  ) call_counts ON l.id = call_counts.lead_id
  WHERE l.asignado_a = auth.uid()
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Drop and recreate get_analyst_assigned_leads_v2 with correct column reference
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads_v2(int, int, timestamptz, timestamptz, boolean);

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads_v2(
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_is_test boolean DEFAULT false
)
RETURNS TABLE (
  lead_id text,
  nombre text,
  email text,
  telefono text,
  estado text,
  created_at timestamptz,
  current_stage text,
  final_decision text,
  notas text,
  analista_id uuid,
  analista_nombre text,
  analista_email text,
  total_llamadas bigint,
  zona_nombre text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id::text as lead_id,
    l.nombre::text as nombre,
    l.email::text as email,
    l.telefono::text as telefono,
    l.estado::text as estado,
    l.created_at,
    lap.current_stage::text as current_stage,
    lap.final_decision::text as final_decision,
    l.notas::text as notas,
    p.id as analista_id,
    p.display_name::text as analista_nombre,
    p.email::text as analista_email,
    COALESCE(call_counts.total, 0) as total_llamadas,
    zon.nombre::text as zona_nombre
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles p ON l.asignado_a = p.id
  LEFT JOIN public.zonas_operacion_nacional zon ON l.zona_preferida_id = zon.id
  LEFT JOIN (
    SELECT lead_id, COUNT(*) as total
    FROM public.lead_call_logs
    GROUP BY lead_id
  ) call_counts ON l.id = call_counts.lead_id
  WHERE l.asignado_a = auth.uid()
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.created_at >= p_date_from)
    AND (p_date_to IS NULL OR l.created_at <= p_date_to)
    AND (l.is_test = p_is_test OR (l.is_test IS NULL AND p_is_test = false))
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads(int, int, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analyst_assigned_leads_v2(int, int, timestamptz, timestamptz, boolean) TO authenticated;