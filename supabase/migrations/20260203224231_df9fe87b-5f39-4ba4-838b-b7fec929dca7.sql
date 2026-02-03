-- Fix get_current_user_role_secure to filter inactive roles
-- This prevents users with inactive role assignments from accessing RLS-protected data

CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
    AND is_active = true  -- CRITICAL: Only consider active roles
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'planificador' THEN 4
      WHEN 'coordinador_operaciones' THEN 5
      WHEN 'supply_lead' THEN 6
      WHEN 'ejecutivo_ventas' THEN 7
      WHEN 'instalador' THEN 8
      WHEN 'monitoreo' THEN 9
      ELSE 10
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_current_user_role_secure() IS 
'Returns the highest-priority ACTIVE role for the current authenticated user. 
Fixed to filter by is_active = true to prevent inactive role assignments from granting access.';