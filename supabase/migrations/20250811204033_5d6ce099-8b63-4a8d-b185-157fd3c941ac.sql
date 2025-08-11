-- Fix get_my_permissions with SQL language body to avoid DECLARE/BEGIN syntax issues
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE(
  id uuid,
  permission_type text,
  permission_id text,
  allowed boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT rp.id, rp.permission_type, rp.permission_id, rp.allowed
  FROM public.role_permissions rp
  WHERE rp.role = public.get_current_user_role_secure()
  ORDER BY rp.permission_type, rp.permission_id;
$$;