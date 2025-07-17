-- Corregir la función get_analyst_assigned_leads para evitar problemas de permisos
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
    l.id::text as lead_id,
    COALESCE(l.nombre_completo, l.nombre)::text as lead_nombre,
    l.email::text as lead_email,
    l.telefono::text as lead_telefono,
    l.estado::text as lead_estado,
    l.created_at as lead_fecha_creacion,
    COALESCE(lap.current_stage, 
      CASE 
        WHEN l.estado = 'rechazado' THEN 'rejected'
        WHEN l.estado = 'aprobado' THEN 'approved' 
        ELSE 'phone_interview'
      END
    )::text as approval_stage,
    COALESCE(lap.phone_interview_completed, false) as phone_interview_completed,
    COALESCE(lap.second_interview_required, false) as second_interview_required,
    COALESCE(lap.final_decision, 
      CASE 
        WHEN l.estado = 'rechazado' THEN 'rejected'
        WHEN l.estado = 'aprobado' THEN 'approved'
        ELSE NULL
      END
    )::text as final_decision,
    COALESCE(l.notas, '')::text as notas,
    -- Información del analista de manera segura
    COALESCE(assigned_analyst.display_name, assigned_analyst.email, 'Sin asignar')::text as analyst_name,
    COALESCE(assigned_analyst.email, '')::text as analyst_email
  FROM public.leads l
  LEFT JOIN public.lead_approval_process lap ON l.id::text = lap.lead_id::text
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
  ORDER BY l.created_at DESC;
END;
$$;