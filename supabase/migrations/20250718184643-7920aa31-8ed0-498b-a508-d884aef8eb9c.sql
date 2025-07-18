-- Actualizar la función para ser más robusta y agregar debugging
CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  has_role boolean := false;
  is_admin_email boolean := false;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, denegar acceso
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si es admin@admin.com directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles en user_roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager', 'coordinador_operaciones')
  ) INTO has_role;
  
  RETURN has_role;
END;
$$;