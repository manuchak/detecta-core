-- Fix security issue: Restrict system_limits access to prevent business rule exploitation
-- Remove public and overly permissive authenticated access policies

-- Drop problematic public read policy
DROP POLICY IF EXISTS "Anyone can read system limits" ON public.system_limits;

-- Drop overly permissive authenticated read policy  
DROP POLICY IF EXISTS "system_limits_authenticated_read" ON public.system_limits;

-- Create restricted policy for system limits - only admins and specific roles that need business rules
CREATE POLICY "Restricted system limits access" 
ON public.system_limits 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'coordinador_operaciones', 'supply_admin')
  )
);

-- Keep existing admin management policies as they already have proper restrictions