-- Fix function redeclaration error by dropping before creating
DROP FUNCTION IF EXISTS public.get_my_permissions();

CREATE FUNCTION public.get_my_permissions()
RETURNS TABLE(
  id uuid,
  role text,
  permission_type text,
  permission_id text,
  allowed boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.role,
    rp.permission_type,
    rp.permission_id,
    rp.allowed,
    rp.created_at,
    rp.updated_at
  FROM public.role_permissions rp
  WHERE rp.role = public.get_current_user_role_secure()
    AND rp.allowed = true
  ORDER BY rp.permission_type, rp.permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';