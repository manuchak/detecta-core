-- Actualizar las políticas RLS para whatsapp_configurations
DROP POLICY IF EXISTS "Admins can manage WhatsApp configurations" ON public.whatsapp_configurations;

-- Política más específica para administradores
CREATE POLICY "Admin access to WhatsApp configurations" 
ON public.whatsapp_configurations 
FOR ALL 
USING (
  is_super_admin() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);