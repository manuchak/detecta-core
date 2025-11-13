-- Actualizar función get_users_with_roles_secure para incluir supply_admin y supply_lead
-- Esto permite que el equipo de Supply pueda ver analistas disponibles para asignar leads

CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Incluir supply_admin y supply_lead en los roles que pueden ejecutar esta función
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
  ) THEN
    RAISE EXCEPTION 'Access denied. Lead assignment management privileges required.';
  END IF;
  
  -- Retornar usuarios con roles relevantes para asignación de leads
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
  ORDER BY p.display_name;
END;
$$;