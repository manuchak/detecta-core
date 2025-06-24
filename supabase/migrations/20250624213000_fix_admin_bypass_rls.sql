
-- Crear función para verificar si un usuario es admin sin recursión RLS
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificación directa sin usar políticas RLS
  -- Permitir a admin@admin.com directamente
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = current_user_id AND email = 'admin@admin.com'
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar si tiene rol de admin u owner
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Crear función para actualizar permisos de forma segura
CREATE OR REPLACE FUNCTION public.update_role_permission_secure(
  p_permission_id UUID,
  p_allowed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT public.is_admin_bypass_rls() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar permisos';
  END IF;

  -- Actualizar el permiso
  UPDATE public.role_permissions
  SET 
    allowed = p_allowed,
    updated_at = now()
  WHERE id = p_permission_id;

  -- Verificar que se actualizó
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permiso no encontrado';
  END IF;

  RETURN true;
END;
$$;
