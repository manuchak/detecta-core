-- Security Fix: Clean and recreate servicios_segmentados policies
-- Remove existing policies first, then create secure ones

DROP POLICY IF EXISTS "servicios_segmentados_secure_read" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_secure_write" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_public_read" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "Allow read servicios_segmentados" ON public.servicios_segmentados;

-- Ensure RLS is enabled
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "servicios_segmentados_business_intelligence_read" 
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

CREATE POLICY "servicios_segmentados_management_write" 
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