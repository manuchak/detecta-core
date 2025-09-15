-- Create new function for managing lead assignments with more flexible permissions
CREATE OR REPLACE FUNCTION public.can_manage_lead_assignments()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  );
END;
$$;

-- Update get_users_with_roles_secure to use the new permission function
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(id uuid, email text, display_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow users with lead assignment management permissions to access this function
  IF NOT public.can_manage_lead_assignments() THEN
    RAISE EXCEPTION 'Access denied. Lead assignment management privileges required.';
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
$$;