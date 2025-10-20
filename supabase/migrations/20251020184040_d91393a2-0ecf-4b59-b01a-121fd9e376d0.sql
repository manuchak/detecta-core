-- Función para obtener leads asignados con paginación
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  lead_id text,
  nombre text,
  email text,
  telefono text,
  lead_estado text,
  fecha_creacion timestamp with time zone,
  final_decision text,
  has_successful_call boolean,
  fecha_entrada_pool timestamp with time zone,
  zona_preferida_id uuid,
  zona_nombre text,
  analista_nombre text,
  analista_email text,
  interview_in_progress boolean,
  interview_started_at timestamp with time zone,
  notas text
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
    l.nombre,
    l.email,
    l.telefono,
    l.estado as lead_estado,
    l.fecha_creacion,
    lap.final_decision::text,
    COALESCE(
      EXISTS(
        SELECT 1 FROM manual_call_logs mcl 
        WHERE mcl.lead_id = l.id 
        AND mcl.call_outcome = 'successful'
      ), 
      false
    ) as has_successful_call,
    l.fecha_entrada_pool,
    l.zona_preferida_id,
    z.nombre as zona_nombre,
    p.display_name as analista_nombre,
    p.email as analista_email,
    COALESCE(l.interview_in_progress, false) as interview_in_progress,
    l.interview_started_at,
    l.notas
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.zonas z ON l.zona_preferida_id = z.id
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
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to)
  ORDER BY l.fecha_creacion DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Función para contar leads asignados (para paginación)
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
          AND ur.role IN ('admin', 'owner', 'manager')
        )
        AND l.asignado_a IS NOT NULL
      )
    )
    AND l.fecha_entrada_pool IS NULL
    AND (p_date_from IS NULL OR l.fecha_creacion >= p_date_from)
    AND (p_date_to IS NULL OR l.fecha_creacion <= p_date_to);
  
  RETURN total_count;
END;
$$;