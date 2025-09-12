-- Fix security issue: Restrict system_limits access to prevent business rule exploitation
-- Remove public and overly permissive authenticated access policies

-- Drop problematic public read policy
DROP POLICY IF EXISTS "Anyone can read system limits" ON public.system_limits;

-- Drop overly permissive authenticated read policy  
DROP POLICY IF EXISTS "system_limits_authenticated_read" ON public.system_limits;

-- Drop any existing restricted policy to avoid conflicts
DROP POLICY IF EXISTS "Restricted system limits access" ON public.system_limits;

-- Create new restricted policy for system limits - only specific authorized roles
CREATE POLICY "system_limits_restricted_role_access" 
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