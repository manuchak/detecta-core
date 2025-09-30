-- Fase 1: Crear función RPC mejorada para obtener TODOS los usuarios con roles
-- Esta función muestra todos los usuarios del sistema, no solo los administrativos

CREATE OR REPLACE FUNCTION public.get_all_users_with_roles_secure()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamptz,
  last_login timestamptz,
  is_verified boolean,
  role_category text,
  role_priority integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Verificar que el usuario actual sea administrador
  SELECT ur.role INTO current_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY
    CASE ur.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      ELSE 10
    END
  LIMIT 1;
  
  -- Solo permitir a administradores ver todos los usuarios
  IF current_user_role NOT IN ('admin', 'owner', 'supply_admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Retornar TODOS los usuarios con su información completa
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.display_name, p.email) as display_name,
    COALESCE(ur.role, 'unverified') as role,
    p.created_at,
    p.last_login,
    COALESCE(p.is_verified, false) as is_verified,
    -- Categorizar roles para mejor organización
    CASE 
      WHEN ur.role IN ('owner', 'admin') THEN 'super_admin'
      WHEN ur.role IN ('supply_admin', 'coordinador_operaciones', 'jefe_seguridad') THEN 'admin'
      WHEN ur.role IN ('analista_seguridad', 'supply_lead', 'ejecutivo_ventas', 'bi', 'monitoring_supervisor') THEN 'management'
      WHEN ur.role IN ('monitoring', 'supply', 'instalador', 'soporte') THEN 'operational'
      WHEN ur.role IN ('custodio') THEN 'field'
      WHEN ur.role IN ('pending') THEN 'pending'
      ELSE 'unverified'
    END as role_category,
    -- Prioridad para ordenamiento
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
      WHEN 'soporte' THEN 14
      WHEN 'custodio' THEN 15
      WHEN 'pending' THEN 16
      ELSE 17
    END as role_priority
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  ORDER BY 
    -- Ordenar por prioridad de rol primero, luego por fecha de creación
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
      WHEN 'soporte' THEN 14
      WHEN 'custodio' THEN 15
      WHEN 'pending' THEN 16
      ELSE 17
    END,
    p.created_at DESC;
END;
$$;