-- Fix: Add ORDER BY role priority before LIMIT 1 in caller role check
-- This ensures users with multiple roles use their most privileged role for permission checks

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles_secure()
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  is_verified BOOLEAN,
  role_category TEXT,
  role_priority INTEGER,
  is_active BOOLEAN,
  archived_at TIMESTAMPTZ,
  archived_by UUID,
  archive_reason TEXT,
  archived_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- FIX: Order by role priority before LIMIT 1 to get most privileged role
  SELECT ur.role INTO caller_role 
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.is_active = true
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'coordinador_operaciones' THEN 4
      WHEN 'jefe_seguridad' THEN 5
      WHEN 'analista_seguridad' THEN 6
      WHEN 'supply_lead' THEN 7
      WHEN 'ejecutivo_ventas' THEN 8
      WHEN 'bi' THEN 9
      WHEN 'monitoring_supervisor' THEN 10
      WHEN 'monitoring' THEN 11
      WHEN 'supply' THEN 12
      WHEN 'instalador' THEN 13
      WHEN 'planificador' THEN 14
      WHEN 'soporte' THEN 15
      WHEN 'custodio' THEN 16
      ELSE 99
    END
  LIMIT 1;

  IF caller_role NOT IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones') THEN
    RAISE EXCEPTION 'No tienes permisos para ver usuarios';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.email, au.email)::TEXT as email,
    COALESCE(p.display_name, p.email, au.email)::TEXT as display_name,
    COALESCE(ur.role, 'pending')::TEXT as role,
    p.created_at,
    au.last_sign_in_at as last_login,
    au.email_confirmed_at IS NOT NULL as is_verified,
    CASE 
      WHEN ur.role IN ('owner', 'admin') THEN 'super_admin'
      WHEN ur.role IN ('supply_admin', 'coordinador_operaciones', 'jefe_seguridad') THEN 'admin'
      WHEN ur.role IN ('analista_seguridad', 'supply_lead', 'bi', 'monitoring_supervisor') THEN 'management'
      WHEN ur.role IN ('ejecutivo_ventas', 'supply', 'monitoring', 'planificador', 'soporte') THEN 'operational'
      WHEN ur.role IN ('instalador', 'custodio') THEN 'field'
      WHEN ur.role = 'pending' THEN 'pending'
      ELSE 'unverified'
    END::TEXT as role_category,
    CASE 
      WHEN ur.role = 'owner' THEN 1
      WHEN ur.role = 'admin' THEN 2
      WHEN ur.role = 'supply_admin' THEN 3
      WHEN ur.role = 'coordinador_operaciones' THEN 4
      WHEN ur.role = 'jefe_seguridad' THEN 5
      WHEN ur.role = 'analista_seguridad' THEN 6
      WHEN ur.role = 'supply_lead' THEN 7
      WHEN ur.role = 'ejecutivo_ventas' THEN 8
      WHEN ur.role = 'bi' THEN 9
      WHEN ur.role = 'monitoring_supervisor' THEN 10
      WHEN ur.role = 'monitoring' THEN 11
      WHEN ur.role = 'supply' THEN 12
      WHEN ur.role = 'instalador' THEN 13
      WHEN ur.role = 'planificador' THEN 14
      WHEN ur.role = 'soporte' THEN 15
      WHEN ur.role = 'custodio' THEN 16
      ELSE 99
    END as role_priority,
    COALESCE(ur.is_active, true) as is_active,
    ur.archived_at,
    ur.archived_by,
    ur.archive_reason,
    archiver.display_name::TEXT as archived_by_name
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  LEFT JOIN public.profiles archiver ON ur.archived_by = archiver.id
  ORDER BY COALESCE(ur.is_active, true) DESC, role_priority ASC, p.display_name ASC;
END;
$$;