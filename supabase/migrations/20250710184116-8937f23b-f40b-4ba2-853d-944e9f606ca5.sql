-- Corregir políticas RLS para whatsapp_configurations
DROP POLICY IF EXISTS "Admin access to WhatsApp configurations" ON public.whatsapp_configurations;

-- Crear política más permisiva que funcione correctamente
CREATE POLICY "Enable all for admins on whatsapp_configurations" 
ON public.whatsapp_configurations 
FOR ALL 
USING (
  -- Permitir acceso a admins usando función segura
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
  OR
  -- Fallback para admin@admin.com
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email = 'admin@admin.com'
  )
)
WITH CHECK (
  -- Same check for inserts/updates
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
  OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND email = 'admin@admin.com'
  )
);