-- Drop and recreate get_analyst_assigned_leads function with proper authentication handling
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads();

CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
 RETURNS TABLE(lead_id text, lead_nombre text, lead_email text, lead_telefono text, lead_estado text, lead_fecha_creacion timestamp with time zone, approval_stage text, phone_interview_completed boolean, second_interview_required boolean, final_decision text, notas text, zona_preferida_id uuid, zona_nombre character varying(100), fecha_entrada_pool timestamp with time zone, motivo_pool text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_has_access boolean := false;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Check if user has admin/management access
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = current_user_id 
    AND ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
  ) INTO user_has_access;
  
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
    l.zona_preferida_id,
    z.nombre as zona_nombre,
    l.fecha_entrada_pool,
    l.motivo_pool
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.zonas_operacion_nacional z ON l.zona_preferida_id = z.id
  WHERE 
    (l.asignado_a = current_user_id) -- User's assigned leads
    OR 
    (user_has_access = true AND l.asignado_a IS NOT NULL) -- Admin access to all assigned leads
  ORDER BY 
    CASE l.estado 
      WHEN 'aprobado_en_espera' THEN 1 
      ELSE 0 
    END,
    l.fecha_creacion DESC;
END;
$function$;