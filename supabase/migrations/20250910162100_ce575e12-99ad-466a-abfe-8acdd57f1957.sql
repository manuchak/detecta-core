-- SECURITY FIX: Remove public access to sensitive financial categorization data
-- and clean up redundant policies on subcategorias_gastos table

-- Drop the dangerous public read policy that exposes financial structure
DROP POLICY IF EXISTS "Todos pueden ver subcategorías" ON public.subcategorias_gastos;

-- Clean up redundant policies to avoid confusion
DROP POLICY IF EXISTS "Admins pueden gestionar subcategorías" ON public.subcategorias_gastos;
DROP POLICY IF EXISTS "subcategorias_gastos_admin_restricted" ON public.subcategorias_gastos;
DROP POLICY IF EXISTS "subcategorias_gastos_financial_access" ON public.subcategorias_gastos;
DROP POLICY IF EXISTS "subcategorias_gastos_manage" ON public.subcategorias_gastos;
DROP POLICY IF EXISTS "subcategorias_gastos_read_restricted" ON public.subcategorias_gastos;

-- Create secure, consolidated policies for financial data
-- Only authorized financial and administrative roles can read expense categories
CREATE POLICY "subcategorias_gastos_secure_read" 
ON public.subcategorias_gastos 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi', 'coordinador_operaciones')
  )
);

-- Only admins and supply admins can modify financial categorization
CREATE POLICY "subcategorias_gastos_secure_write" 
ON public.subcategorias_gastos 
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