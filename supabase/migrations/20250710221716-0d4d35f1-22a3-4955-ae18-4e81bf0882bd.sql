-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS public.get_analyst_assigned_leads();

-- Crear la función mejorada con información del analista
CREATE OR REPLACE FUNCTION public.get_analyst_assigned_leads()
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
  analyst_name text,
  analyst_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
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
    -- Información del analista que tiene asignado este lead
    assigned_analyst.display_name as analyst_name,
    assigned_analyst.email as analyst_email
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id = lap.lead_id
  LEFT JOIN public.profiles assigned_analyst ON l.asignado_a = assigned_analyst.id
  WHERE l.asignado_a = current_user_id
    OR (
      -- También permitir a administradores ver todos los leads asignados
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = current_user_id 
        AND ur.role IN ('admin', 'owner', 'manager')
      )
      AND l.asignado_a IS NOT NULL
    )
  ORDER BY l.fecha_creacion DESC;
END;
$$;