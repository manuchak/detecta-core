
-- Fix 1: Allow customer_success (and similar mgmt roles) to read profiles for CSM dropdowns
CREATE POLICY "customer_success_view_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin','owner','customer_success','ejecutivo_ventas','coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  )
);

-- Fix 2: Allow customer_success to update pc_clientes (for CSM assignment in Cartera)
CREATE POLICY "customer_success_assign_csm_pc_clientes"
ON public.pc_clientes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'customer_success'
    AND (is_active IS NULL OR is_active = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'customer_success'
    AND (is_active IS NULL OR is_active = true)
  )
);
