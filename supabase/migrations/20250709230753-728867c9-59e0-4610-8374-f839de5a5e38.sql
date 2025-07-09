-- Fix infinite recursion in user_roles policies - Part 1: Cleanup
-- Drop ALL existing policies on user_roles to start fresh
DO $$
DECLARE 
    policy_name text;
BEGIN
    -- Get all policy names for user_roles table
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_name);
    END LOOP;
END $$;

-- Create a secure function to check admin role without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  is_admin_role boolean := false;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin email directly from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- If admin@admin.com, allow access
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Check roles directly (without using RLS policies)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  ) INTO is_admin_role;
  
  RETURN is_admin_role;
END;
$$;

-- Create clean, non-recursive policies
CREATE POLICY "admin_email_manage_user_roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);

CREATE POLICY "admins_manage_user_roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin_user_secure());

CREATE POLICY "users_view_own_user_roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "service_role_manage_user_roles" 
ON public.user_roles 
FOR ALL 
TO service_role 
USING (true);

-- Add comment to document the fix
COMMENT ON FUNCTION public.is_admin_user_secure() IS 'Secure function to check admin role without causing RLS recursion';