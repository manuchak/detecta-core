
-- Función para obtener usuarios con roles y emails para identificación
CREATE OR REPLACE FUNCTION public.get_users_with_roles_for_admin()
RETURNS TABLE(
  user_id uuid,
  email text,
  role text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para ver esta información';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  ORDER BY au.email;
END;
$$;

-- Función para actualizar rol de usuario por email
CREATE OR REPLACE FUNCTION public.update_user_role_by_email(
  p_email text,
  p_new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Solo permitir a administradores
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar roles';
  END IF;

  -- Buscar el user_id por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', p_email;
  END IF;

  -- Eliminar rol existente
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insertar nuevo rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, p_new_role);

  RETURN true;
END;
$$;

-- Conceder permisos
GRANT EXECUTE ON FUNCTION public.get_users_with_roles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_by_email(text, text) TO authenticated;
