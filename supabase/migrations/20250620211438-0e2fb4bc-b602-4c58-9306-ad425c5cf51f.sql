
-- Crear función para verificar si un usuario es admin sin recursión RLS
CREATE OR REPLACE FUNCTION public.get_user_role_direct(user_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_role TEXT;
BEGIN
  -- Obtener el rol directamente sin usar políticas RLS
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = user_uid
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- Crear función para obtener todos los usuarios con sus roles de forma segura
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que el usuario actual es admin u owner
  IF NOT public.is_admin_bypass_rls() THEN
    RAISE EXCEPTION 'Sin permisos para acceder a esta información';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    COALESCE(ur.role, 'unverified') as role,
    p.created_at,
    p.last_login
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Crear función para obtener roles disponibles de forma segura
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS TABLE(role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(ARRAY[
    'owner',
    'admin', 
    'supply_admin',
    'coordinador_operaciones',
    'jefe_seguridad',
    'analista_seguridad',
    'supply_lead',
    'ejecutivo_ventas',
    'custodio',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'supply',
    'instalador',
    'soporte',
    'pending',
    'unverified'
  ]::text[]) as role
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'coordinador_operaciones' THEN 4
      WHEN 'jefe_seguridad' THEN 5
      WHEN 'analista_seguridad' THEN 6
      WHEN 'supply_lead' THEN 7
      WHEN 'ejecutivo_ventas' THEN 8
      WHEN 'custodio' THEN 9
      WHEN 'bi' THEN 10
      WHEN 'monitoring_supervisor' THEN 11
      WHEN 'monitoring' THEN 12
      WHEN 'supply' THEN 13
      WHEN 'instalador' THEN 14
      WHEN 'soporte' THEN 15
      WHEN 'pending' THEN 16
      WHEN 'unverified' THEN 17
      ELSE 18
    END;
END;
$$;
