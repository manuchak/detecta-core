
-- Función para verificar permisos de administrador sin RLS
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Obtener email del usuario
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Verificar admin@admin.com directamente
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar rol en user_roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Función para actualizar permisos de roles de forma segura
CREATE OR REPLACE FUNCTION public.update_role_permission_secure(
  p_permission_id UUID,
  p_allowed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_email TEXT;
  is_admin_user BOOLEAN := false;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Obtener el email del usuario desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Verificar si es admin@admin.com (caso especial)
  IF user_email = 'admin@admin.com' THEN
    is_admin_user := true;
  ELSE
    -- Verificar si tiene rol de admin u owner
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = current_user_id AND role IN ('admin', 'owner')
    ) INTO is_admin_user;
  END IF;
  
  -- Solo permitir a administradores
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Sin permisos para actualizar permisos de roles';
  END IF;
  
  -- Actualizar el permiso directamente evitando RLS
  UPDATE public.role_permissions
  SET allowed = p_allowed,
      updated_at = now()
  WHERE id = p_permission_id;
  
  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permiso no encontrado con ID: %', p_permission_id;
  END IF;
  
  RETURN true;
END;
$$;
