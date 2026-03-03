-- Allow CS-related roles to read user_roles for dropdown population (e.g., CSM assignment)
CREATE POLICY "cs_roles_read_user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
    AND ur2.role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones', 'planificador', 'bi')
    AND (ur2.is_active IS NULL OR ur2.is_active = true)
  )
);