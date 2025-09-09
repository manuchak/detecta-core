-- Security Fix: Secure ml_model_configurations table from unauthorized access
-- This fixes the critical vulnerability where ML configurations were publicly readable

-- First, drop all existing insecure policies
DROP POLICY IF EXISTS "Anyone can manage ML configurations" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "Anyone can read ML configurations" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "Users can read ML configurations" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_public_read" ON public.ml_model_configurations;

-- Ensure RLS is enabled
ALTER TABLE public.ml_model_configurations ENABLE ROW LEVEL SECURITY;

-- Create secure policies that restrict access to authorized technical roles only
-- Only admin, owner, and bi roles can read ML configurations
CREATE POLICY "ml_model_configurations_technical_read_only" 
ON public.ml_model_configurations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

-- Only admin and owner can modify ML configurations
CREATE POLICY "ml_model_configurations_admin_modify_only" 
ON public.ml_model_configurations 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Clean up any duplicate or conflicting policies
DROP POLICY IF EXISTS "BI data access restricted to authorized roles" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "BI data restricted access - ml_models" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "Only admins can modify ml_model_configurations" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_configs_tech_restricted" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_admin_access" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_admin_manage" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_admin_only" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_technical_access" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "ml_model_configurations_restricted_access" ON public.ml_model_configurations;