
-- Crear función mejorada para obtener usuarios con roles de forma segura
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que el usuario actual es admin u owner
  IF NOT public.is_admin_bypass_rls() THEN
    RAISE EXCEPTION 'Sin permisos para acceder a esta información';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    COALESCE(p.display_name, au.email)::TEXT as display_name,
    COALESCE(ur.role, 'unverified')::TEXT as role,
    au.created_at,
    COALESCE(p.last_login, au.created_at) as last_login
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE au.email_confirmed_at IS NOT NULL -- Solo usuarios con email confirmado
  ORDER BY au.created_at DESC;
END;
$$;

-- Crear función para verificar si un usuario puede administrar roles
CREATE OR REPLACE FUNCTION public.can_manage_user_roles()
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

-- Crear función para actualizar roles de usuario de forma segura
CREATE OR REPLACE FUNCTION public.update_user_role_secure(
  p_user_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar permisos
  IF NOT public.can_manage_user_roles() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar roles';
  END IF;

  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Eliminar rol existente
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  -- Insertar nuevo rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role);

  RETURN true;
END;
$$;

-- Crear función para verificar email de usuario
CREATE OR REPLACE FUNCTION public.verify_user_email_secure(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar permisos
  IF NOT public.can_manage_user_roles() THEN
    RAISE EXCEPTION 'Sin permisos para verificar emails';
  END IF;

  -- Actualizar perfil como verificado
  UPDATE public.profiles
  SET is_verified = true, updated_at = now()
  WHERE id = p_user_id;
  
  -- Cambiar rol de unverified a pending si corresponde
  UPDATE public.user_roles
  SET role = 'pending'
  WHERE user_id = p_user_id AND role = 'unverified';

  RETURN true;
END;
$$;
