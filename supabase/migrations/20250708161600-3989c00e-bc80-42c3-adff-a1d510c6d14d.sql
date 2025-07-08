-- Solución definitiva para recursión RLS usando schema public
-- Compatible con Supabase auth management

-- 1. ELIMINAR TODAS las políticas problemáticas primero
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
DROP POLICY IF EXISTS "Analysts can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "admins_full_access_leads" ON public.leads;
DROP POLICY IF EXISTS "analysts_update_assigned_leads" ON public.leads;
DROP POLICY IF EXISTS "analysts_view_assigned_leads" ON public.leads;
DROP POLICY IF EXISTS "users_own_roles_only" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manages_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "leads_public_read" ON public.leads;
DROP POLICY IF EXISTS "leads_public_create" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_full_access" ON public.leads;
DROP POLICY IF EXISTS "leads_analyst_assigned" ON public.leads;

-- 2. Función sin recursión para verificar admin - método seguro
CREATE OR REPLACE FUNCTION public.check_admin_secure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  is_admin_role boolean := false;
BEGIN
  -- Obtener usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar email admin directamente desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  -- Si es admin@admin.com, permitir acceso
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles de manera directa (sin usar políticas RLS)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  ) INTO is_admin_role;
  
  RETURN is_admin_role;
END;
$$;

-- 3. Función para verificar roles específicos
CREATE OR REPLACE FUNCTION public.user_has_role_direct(role_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id AND role = role_name
  );
END;
$$;

-- 4. Políticas RLS seguras para user_roles
CREATE POLICY "user_roles_own_view"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin_all"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.check_admin_secure())
WITH CHECK (public.check_admin_secure());

-- 5. Políticas RLS para leads (sin recursión)
CREATE POLICY "leads_all_read"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "leads_all_create"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "leads_admin_manage"
ON public.leads
FOR ALL
TO authenticated
USING (public.check_admin_secure())
WITH CHECK (public.check_admin_secure());

CREATE POLICY "leads_analyst_update"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  asignado_a = auth.uid() 
  OR public.check_admin_secure()
  OR public.user_has_role_direct('supply_admin')
)
WITH CHECK (
  asignado_a = auth.uid() 
  OR public.check_admin_secure()
  OR public.user_has_role_direct('supply_admin')
);

-- 6. Conceder permisos necesarios
GRANT EXECUTE ON FUNCTION public.check_admin_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_direct(text) TO authenticated;

-- 7. Configurar admin@admin.com correctamente
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Asegurar perfil existe
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