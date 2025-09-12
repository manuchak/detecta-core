-- Fix security issue: Restrict currency configuration access to authenticated users only
-- Remove the public read policy and replace with authenticated-only access

DROP POLICY IF EXISTS "Anyone can view currency config" ON public.configuracion_moneda;

-- Create new policy that requires authentication for reading currency config
CREATE POLICY "Authenticated users can view currency config" 
ON public.configuracion_moneda 
FOR SELECT 
TO authenticated
USING (activo = true);

-- Keep the existing admin management policy as-is since it already has proper restrictions