-- Security Fix: Secure zonas_operacion_nacional table access
-- CRITICAL: Strategic operational data was publicly exposed

-- Clean up existing insecure policies
DROP POLICY IF EXISTS "Allow read zonas_operacion_nacional" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_all_read" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_read_all" ON public.zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_public_read" ON public.zonas_operacion_nacional;

-- Ensure RLS is enabled
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;

-- Create secure access policy including supply roles to preserve functionality
CREATE POLICY "zonas_operacion_secure_access" 
ON public.zonas_operacion_nacional 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 'owner', 'bi', 'supply_admin', 'supply_lead', 'supply',
      'coordinador_operaciones', 'monitoring_supervisor', 'monitoring', 
      'jefe_seguridad', 'ejecutivo_ventas'
    )
  )
);

-- Secure write access for management roles only
CREATE POLICY "zonas_operacion_secure_write" 
ON public.zonas_operacion_nacional 
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