
-- Migración para corregir el acceso a leads y limpiar el sistema de autenticación
-- Eliminando funciones conflictivas y creando un sistema consistente

-- 1. Limpiar funciones duplicadas que pueden estar causando conflictos
DROP FUNCTION IF EXISTS public.is_admin_bypass_rls() CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_user_roles() CASCADE;
DROP FUNCTION IF EXISTS public.get_users_with_roles_secure() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role_secure(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.verify_user_email_secure(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user_secure() CASCADE;

-- 2. Crear función principal para verificar admin (sin recursión)
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
  current_user_id := auth.uid();
  
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
  
  -- Verificar rol en user_roles directamente
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
  
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
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

-- 4. Función para obtener usuarios con roles
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

-- 5. Función para actualizar roles
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
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar roles';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role);

  RETURN true;
END;
$$;

-- 6. Función para verificar email
CREATE OR REPLACE FUNCTION public.verify_user_email_secure(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para verificar emails';
  END IF;

  UPDATE public.profiles
  SET is_verified = true, updated_at = now()
  WHERE id = p_user_id;
  
  UPDATE public.user_roles
  SET role = 'pending'
  WHERE user_id = p_user_id AND role = 'unverified';

  RETURN true;
END;
$$;

-- 7. Configurar admin@admin.com
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now())
    WHERE id = admin_user_id;
    
    INSERT INTO public.profiles (id, email, display_name, is_verified, created_at, updated_at)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrador', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      display_name = 'Administrador',
      is_verified = true,
      updated_at = now();
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 8. Habilitar RLS en la tabla leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas para leads
-- Los administradores pueden ver todos los leads
CREATE POLICY "Admins can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

-- Los administradores pueden insertar leads
CREATE POLICY "Admins can insert leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user_secure());

-- Los administradores pueden actualizar leads
CREATE POLICY "Admins can update leads"
ON public.leads FOR UPDATE
TO authenticated
USING (public.is_admin_user_secure());

-- Los administradores pueden eliminar leads
CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (public.is_admin_user_secure());

-- Los usuarios asignados pueden ver sus leads
CREATE POLICY "Assigned users can view their leads"
ON public.leads FOR SELECT
TO authenticated
USING (asignado_a = auth.uid());

-- Los usuarios asignados pueden actualizar sus leads
CREATE POLICY "Assigned users can update their leads"
ON public.leads FOR UPDATE
TO authenticated
USING (asignado_a = auth.uid());

-- 10. Crear políticas para lead_approval_process
ALTER TABLE public.lead_approval_process ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage approval process"
ON public.lead_approval_process FOR ALL
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Analysts can manage their assigned approvals"
ON public.lead_approval_process FOR ALL
TO authenticated
USING (analyst_id = auth.uid());

-- 11. Conceder permisos a las funciones
GRANT EXECUTE ON FUNCTION public.is_admin_user_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_email_secure(UUID) TO authenticated;

-- 12. Actualizar políticas existentes para consistencia
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

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

-- 13. Políticas para user_roles
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user_secure());
