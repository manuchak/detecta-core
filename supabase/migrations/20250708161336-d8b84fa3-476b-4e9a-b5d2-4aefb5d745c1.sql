-- Solución definitiva para recursión RLS en user_roles y leads
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

-- 2. Función simple y segura para verificar roles sin recursión
CREATE OR REPLACE FUNCTION auth.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = $2
  );
$$;

-- 3. Función para verificar admin usando auth schema (evita recursión)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    -- Verificar admin@admin.com directamente
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND email = 'admin@admin.com'
    ),
    -- O verificar roles admin/owner
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    ),
    false
  );
$$;

-- 4. Políticas RLS simplificadas para user_roles (SIN RECURSIÓN)
CREATE POLICY "users_own_roles_only"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_manages_all_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- 5. Políticas RLS para leads (compatibles con auth management)
CREATE POLICY "leads_public_read"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "leads_public_create"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "leads_admin_full_access"
ON public.leads
FOR ALL
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

CREATE POLICY "leads_analyst_assigned"
ON public.leads
FOR UPDATE
TO authenticated
USING (asignado_a = auth.uid() OR auth.is_admin())
WITH CHECK (asignado_a = auth.uid() OR auth.is_admin());

-- 6. Conceder permisos a las funciones auth
GRANT EXECUTE ON FUNCTION auth.check_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;

-- 7. Asegurar configuración de admin@admin.com
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Buscar admin@admin.com
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@admin.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Asegurar perfil
    INSERT INTO public.profiles (id, email, display_name, is_verified)
    VALUES (admin_user_id, 'admin@admin.com', 'Administrador', true)
    ON CONFLICT (id) DO UPDATE SET
      is_verified = true,
      updated_at = now();
    
    -- Asegurar rol de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;