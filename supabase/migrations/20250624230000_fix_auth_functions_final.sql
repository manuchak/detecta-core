
-- Migración final para corregir todas las funciones de autenticación
-- Eliminando funciones conflictivas y recreando correctamente

-- 1. Eliminar funciones que pueden estar causando conflictos
DROP FUNCTION IF EXISTS public.is_admin_bypass_rls() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_user_roles() CASCADE;
DROP FUNCTION IF EXISTS public.get_users_with_roles_secure() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role_secure(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.verify_user_email_secure(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user_secure() CASCADE;

-- 2. Función principal para verificar si es admin (sin recursión RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar directamente desde auth.users si es admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar rol en user_roles directamente (sin usar políticas RLS)
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- 3. Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  found_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  -- Verificar si es admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
  -- Buscar rol en user_roles
  SELECT role INTO found_role
  FROM public.user_roles
  WHERE user_id = current_user_id
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- 4. Función para obtener usuarios con roles de forma segura
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
  -- Verificar que el usuario actual es admin
  IF NOT public.is_admin_user_secure() THEN
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
  WHERE au.email_confirmed_at IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- 5. Función para actualizar roles de usuario
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
  IF NOT public.is_admin_user_secure() THEN
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

-- 6. Función para verificar email de usuario
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
  IF NOT public.is_admin_user_secure() THEN
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

-- 7. Asegurar que admin@admin.com esté correctamente configurado
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Marcar email como confirmado
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now())
    WHERE id = admin_user_id;
    
    -- Crear o actualizar perfil
    INSERT INTO public.profiles (id, email, display_name, is_verified, created_at, updated_at)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrador', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      display_name = 'Administrador',
      is_verified = true,
      updated_at = now();
    
    -- Asegurar rol de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 8. Conceder permisos necesarios
GRANT EXECUTE ON FUNCTION public.is_admin_user_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_email_secure(UUID) TO authenticated;

-- 9. Actualizar políticas RLS para usar las nuevas funciones
-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Crear nuevas políticas
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user_secure());
