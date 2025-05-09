
-- Create a new role
CREATE OR REPLACE FUNCTION public.create_new_role(new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can create new roles';
  END IF;
  
  -- Check if the role already exists
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DISTINCT role FROM user_roles
    ) AS roles
    WHERE role = new_role
  ) THEN
    RAISE EXCEPTION 'Role already exists';
  END IF;
  
  -- Insert a placeholder user_role entry to register the role
  -- We'll use a placeholder UUID that won't match any real user
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES ('00000000-0000-0000-0000-000000000000', new_role, auth.uid());
  
  -- Grant default permissions for the new role
  -- This could be customized based on your needs
  INSERT INTO public.role_permissions (role, permission_type, permission_id, allowed)
  VALUES 
    (new_role, 'page', 'dashboard', true),
    (new_role, 'page', 'profile', true);
END;
$$;

-- Update a role name
CREATE OR REPLACE FUNCTION public.update_role_name(old_role TEXT, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can update role names';
  END IF;
  
  -- Prevent changes to system roles
  IF old_role IN ('owner', 'admin', 'unverified', 'pending') THEN
    RAISE EXCEPTION 'Cannot modify system roles';
  END IF;
  
  -- Check if the new role name already exists
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DISTINCT role FROM user_roles
      WHERE role != old_role
    ) AS roles
    WHERE role = new_role
  ) THEN
    RAISE EXCEPTION 'Role name already exists';
  END IF;
  
  -- Update user_roles table
  UPDATE public.user_roles
  SET role = new_role
  WHERE role = old_role;
  
  -- Update role_permissions table
  UPDATE public.role_permissions
  SET role = new_role
  WHERE role = old_role;
END;
$$;

-- Delete a role
CREATE OR REPLACE FUNCTION public.delete_role(target_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin or owner
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can delete roles';
  END IF;
  
  -- Prevent deletion of system roles
  IF target_role IN ('owner', 'admin', 'unverified', 'pending') THEN
    RAISE EXCEPTION 'Cannot delete system roles';
  END IF;
  
  -- Check if there are users with this role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = target_role
    AND user_id != '00000000-0000-0000-0000-000000000000'
  ) THEN
    RAISE EXCEPTION 'Cannot delete a role that is assigned to users';
  END IF;
  
  -- Delete the role from user_roles table (including placeholder entry)
  DELETE FROM public.user_roles
  WHERE role = target_role;
  
  -- Delete the role from role_permissions table
  DELETE FROM public.role_permissions
  WHERE role = target_role;
END;
$$;

-- Fixed get_user_role_safe function to resolve infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe(user_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_role TEXT;
BEGIN
  -- Directly query user_roles without going through RLS
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = user_uid
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'bi' THEN 4
      WHEN 'monitoring_supervisor' THEN 5
      WHEN 'monitoring' THEN 6
      WHEN 'supply' THEN 7
      WHEN 'soporte' THEN 8
      WHEN 'pending' THEN 9
      WHEN 'unverified' THEN 10
      ELSE 11
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- Fixed get_user_roles_safe function to include all roles
CREATE OR REPLACE FUNCTION public.get_user_roles_safe()
RETURNS TABLE(role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
    SELECT DISTINCT ur.role
    FROM public.user_roles ur
    ORDER BY
      CASE ur.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'supply_admin' THEN 3
        WHEN 'bi' THEN 4
        WHEN 'monitoring_supervisor' THEN 5
        WHEN 'monitoring' THEN 6
        WHEN 'supply' THEN 7
        WHEN 'soporte' THEN 8
        WHEN 'pending' THEN 9
        WHEN 'unverified' THEN 10
        ELSE 11
      END;
END;
$$;
