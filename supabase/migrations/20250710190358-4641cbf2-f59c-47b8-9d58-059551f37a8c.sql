-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Enable all for admins on whatsapp_configurations" ON whatsapp_configurations;
DROP POLICY IF EXISTS "Admins can manage WhatsApp config" ON whatsapp_configurations;

-- Crear función segura para verificar admin
CREATE OR REPLACE FUNCTION public.is_whatsapp_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si es admin@admin.com directamente desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$function$;

-- Crear política simple y segura
CREATE POLICY "WhatsApp admin access" ON whatsapp_configurations
  FOR ALL USING (public.is_whatsapp_admin())
  WITH CHECK (public.is_whatsapp_admin());