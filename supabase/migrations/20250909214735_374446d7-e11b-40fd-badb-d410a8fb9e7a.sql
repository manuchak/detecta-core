-- Security Fix: Secure servicios_segmentados table - Step by step approach
-- CRITICAL: Strategic business data was publicly exposed to competitors

-- Enable RLS first
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