-- Crear política para permitir que administradores y roles específicos puedan ver todos los user_roles
CREATE POLICY "admins_and_managers_view_all_user_roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  )
);