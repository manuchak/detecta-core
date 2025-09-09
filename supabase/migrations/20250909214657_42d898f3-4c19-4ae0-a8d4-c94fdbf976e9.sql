-- Security Fix: Secure servicios_segmentados table to protect business intelligence
-- CRITICAL: Strategic business data was publicly exposed to competitors

-- First, check if table exists and drop any insecure public policies
DROP POLICY IF EXISTS "servicios_segmentados_public_read" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "Allow read servicios_segmentados" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_all_access" ON public.servicios_segmentados;

-- Ensure RLS is enabled to protect sensitive business data
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;

-- Create secure read access policy for authorized business intelligence roles
CREATE POLICY "servicios_segmentados_secure_read" 
ON public.servicios_segmentados 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 'owner', 'bi', 'supply_admin', 'supply_lead',
      'coordinador_operaciones', 'ejecutivo_ventas', 'monitoring_supervisor'
    )
  )
);

-- Create secure write access policy for management roles only
CREATE POLICY "servicios_segmentados_secure_write" 
ON public.servicios_segmentados 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  )
);