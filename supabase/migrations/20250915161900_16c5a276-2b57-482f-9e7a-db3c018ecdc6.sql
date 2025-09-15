-- Corregir get_users_with_roles_secure() para incluir supply_lead en el filtro y ordenamiento
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(id uuid, email text, display_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores acceder a esta función
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.display_name,
    ur.role
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
    AND p.is_verified = true
  ORDER BY 
    CASE ur.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'supply_lead' THEN 4
      WHEN 'ejecutivo_ventas' THEN 5
      ELSE 10
    END,
    p.display_name;
END;
$function$;