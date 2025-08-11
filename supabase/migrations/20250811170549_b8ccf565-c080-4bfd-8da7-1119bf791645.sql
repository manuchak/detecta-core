-- PHASE 2 CORRECTED: Clean up and fix RLS policies properly

-- First, clean up existing problematic policies that contain hardcoded emails
DROP POLICY IF EXISTS "Admins pueden gestionar recompensas" ON public.rewards;
DROP POLICY IF EXISTS "Admins pueden gestionar todas las redenciones" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can manage permissions safe" ON public.role_permissions;

-- Recreate clean policies without hardcoded emails
CREATE POLICY "Secure admin rewards management"
ON public.rewards
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

CREATE POLICY "Secure admin redemptions management"
ON public.redemptions
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

CREATE POLICY "Secure admin role permissions management"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

-- Create user role check function that uses database roles
CREATE OR REPLACE FUNCTION public.user_has_role_direct(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$$;

-- Update servicios_custodia policies to be more secure
DROP POLICY IF EXISTS "Admin access to all services" ON public.servicios_custodia;
DROP POLICY IF EXISTS "Users can view their services by phone" ON public.servicios_custodia;

CREATE POLICY "Secure admin service access"
ON public.servicios_custodia
FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Secure user service access by phone"
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