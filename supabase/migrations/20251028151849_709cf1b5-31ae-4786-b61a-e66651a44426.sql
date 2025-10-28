-- Fix profiles table RLS policies to prevent unauthorized access
-- Remove overly permissive policies and consolidate duplicate policies

-- Drop all existing policies to rebuild them properly
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_manage_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_leads_read" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view ONLY their own profile (authenticated users only)
CREATE POLICY "profiles_users_view_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Users can insert ONLY their own profile during signup (authenticated users only)
CREATE POLICY "profiles_users_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Policy 3: Users can update ONLY their own profile (authenticated users only)
CREATE POLICY "profiles_users_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 4: Admins can view all profiles
CREATE POLICY "profiles_admins_view_all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Policy 5: Admins can update all profiles
CREATE POLICY "profiles_admins_update_all"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Policy 6: Admins can insert profiles for users
CREATE POLICY "profiles_admins_insert_all"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Policy 7: Admins can delete profiles
CREATE POLICY "profiles_admins_delete_all"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Policy 8: Lead managers can view profiles for assignment purposes
CREATE POLICY "profiles_lead_managers_view"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador', 'supply_admin', 'supply_lead')
  )
);

-- Revoke any public access to the table
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant only to authenticated users (controlled by RLS policies)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;