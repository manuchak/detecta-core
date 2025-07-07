
-- FASE 2: REESTRUCTURACIÓN DE POLÍTICAS RLS
-- Estrategia: Implementar políticas más granulares y seguras

-- PASO 1: Optimizar políticas de la tabla leads
-- Remover la política temporal muy permisiva y crear políticas específicas
DROP POLICY IF EXISTS "authenticated_users_full_access_leads" ON public.leads;

-- Crear políticas granulares para leads basadas en roles y asignación
CREATE POLICY "admins_full_access_leads" ON public.leads
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "analysts_view_assigned_leads" ON public.leads
FOR SELECT 
TO authenticated
USING (
  asignado_a = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "analysts_update_assigned_leads" ON public.leads
FOR UPDATE 
TO authenticated
USING (
  asignado_a = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
)
WITH CHECK (
  asignado_a = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

-- PASO 2: Mejorar políticas de user_roles para mayor seguridad
-- Eliminar políticas muy amplias y crear específicas
DROP POLICY IF EXISTS "admin_email_full_access" ON public.user_roles;
DROP POLICY IF EXISTS "admin_owner_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON public.user_roles;

-- Política específica para admin@admin.com
CREATE POLICY "admin_email_manage_user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND email = 'admin@admin.com'
  )
);

-- Política para administradores con roles
CREATE POLICY "admins_manage_user_roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Política para que usuarios vean sus propios roles
CREATE POLICY "users_view_own_user_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Política para service_role (funciones SECURITY DEFINER)
CREATE POLICY "service_role_manage_user_roles" ON public.user_roles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- PASO 3: Optimizar políticas de profiles
-- Remover políticas muy permisivas en profiles si existen
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Crear políticas específicas para profiles
CREATE POLICY "users_view_own_profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_manage_all_profiles" ON public.profiles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- PASO 4: Crear función helper segura para verificación de roles específicos
CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$$;

-- PASO 5: Documentar las mejoras de seguridad
COMMENT ON POLICY "admins_full_access_leads" ON public.leads IS 'Permite acceso completo a administradores y supply_admin para gestionar leads';
COMMENT ON POLICY "analysts_view_assigned_leads" ON public.leads IS 'Permite a analistas ver solo sus leads asignados';
COMMENT ON POLICY "analysts_update_assigned_leads" ON public.leads IS 'Permite a analistas actualizar solo sus leads asignados';
COMMENT ON FUNCTION public.user_has_role_secure(text) IS 'Función segura para verificar si el usuario actual tiene un rol específico';
