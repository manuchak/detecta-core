-- SECURITY FIX: Remove public access to sensitive business intelligence data
-- and clean up redundant policies on servicios_segmentados table

-- Drop the dangerous public read policy
DROP POLICY IF EXISTS "Todos pueden leer servicios segmentados" ON public.servicios_segmentados;

-- Clean up redundant policies to avoid confusion
DROP POLICY IF EXISTS "BI data restricted access - servicios_segmentados" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "Segmented services access restricted" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_admin_manage" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_bi_access" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_bi_admin_access" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_bi_restricted" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_business_intelligence_read" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_manage_admin_only" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_management_write" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "servicios_segmentados_read_bi" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "Admins pueden gestionar servicios segmentados" ON public.servicios_segmentados;
DROP POLICY IF EXISTS "Only coordinators and admins can modify segmented services" ON public.servicios_segmentados;

-- Create secure, consolidated policies for business intelligence data
-- Only authorized BI roles can read sensitive business data
CREATE POLICY "servicios_segmentados_secure_read" 
ON public.servicios_segmentados 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

-- Only admins and supply admins can modify BI data
CREATE POLICY "servicios_segmentados_secure_write" 
ON public.servicios_segmentados 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);