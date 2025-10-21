-- Create function to check if user has admin access
-- This function checks multiple conditions to determine if the current user has admin privileges
CREATE OR REPLACE FUNCTION check_user_has_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if any of the admin functions exist and return true
  -- Try is_admin_bypass_rls if it exists
  BEGIN
    SELECT is_admin_bypass_rls() INTO has_access;
    IF has_access THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      NULL; -- Function doesn't exist, continue checking
  END;

  -- Try is_admin_user_secure if it exists
  BEGIN
    SELECT is_admin_user_secure() INTO has_access;
    IF has_access THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      NULL; -- Function doesn't exist, continue checking
  END;

  -- Try user_has_role_direct for various admin roles
  BEGIN
    SELECT user_has_role_direct('owner') 
        OR user_has_role_direct('manager') 
        OR user_has_role_direct('supply_admin')
        OR user_has_role_direct('admin')
    INTO has_access;
    IF has_access THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      NULL; -- Function doesn't exist, continue checking
  END;

  -- If none of the checks passed, return false
  RETURN FALSE;
END;
$$;