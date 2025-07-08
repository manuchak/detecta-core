
-- Migración para resolver el problema de recursión infinita en políticas RLS
-- Creando funciones seguras y actualizando políticas problemáticas

-- 1. Crear función principal para verificar admin de forma segura
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

-- 2. Crear función para obtener el rol del usuario actual
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

-- 3. Limpiar y recrear políticas problemáticas en user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- 4. Crear nuevas políticas sin recursión
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin_user_secure());

-- 5. Actualizar políticas en leads para usar las nuevas funciones
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver leads" ON public.leads;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear leads" ON public.leads;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar leads" ON public.leads;

CREATE POLICY "Users can view leads"
ON public.leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all leads"
ON public.leads FOR ALL
TO authenticated
USING (public.is_admin_user_secure());

CREATE POLICY "Analysts can update assigned leads"
ON public.leads FOR UPDATE
TO authenticated
USING (asignado_a = auth.uid() OR public.is_admin_user_secure());

-- 6. Conceder permisos necesarios
GRANT EXECUTE ON FUNCTION public.is_admin_user_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

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
