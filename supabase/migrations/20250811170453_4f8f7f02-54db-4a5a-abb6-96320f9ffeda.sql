-- PHASE 2: Update RLS policies to remove hardcoded email bypasses

-- Fix RLS policies that contain hardcoded email checks
-- These policies currently use 'admin@admin.com' bypasses which are security vulnerabilities

-- Update user_roles RLS policies
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;

CREATE POLICY "Users can see their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

-- Update servicios_custodia RLS policies to remove email bypasses
DROP POLICY IF EXISTS "Admin bypass RLS" ON public.servicios_custodia;
DROP POLICY IF EXISTS "Users can view their own services" ON public.servicios_custodia;

CREATE POLICY "Admins can view all services"
ON public.servicios_custodia
FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Users can view their own services"
ON public.servicios_custodia
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.phone IN (servicios_custodia.telefono, servicios_custodia.telefono_operador)
  )
);

-- Update rewards RLS policies
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
CREATE POLICY "Admins can manage rewards"
ON public.rewards
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

-- Update role_permissions RLS policies  
DROP POLICY IF EXISTS "Admin can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

-- Update redemptions RLS policies
DROP POLICY IF EXISTS "Admins can manage all redemptions" ON public.redemptions;
CREATE POLICY "Admins can manage all redemptions"
ON public.redemptions
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

-- Create secure function to check for management roles without email bypass
CREATE OR REPLACE FUNCTION public.has_management_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  );
END;
$$;