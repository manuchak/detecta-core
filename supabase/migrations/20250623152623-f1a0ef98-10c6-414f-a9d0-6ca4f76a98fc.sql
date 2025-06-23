
-- Migración para habilitar RLS en user_roles de forma segura
-- Archivo: fix-user-roles-rls-security.sql

-- Paso 1: Habilitar RLS en la tabla user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas existentes conflictivas para empezar limpio
DROP POLICY IF EXISTS "Administradores pueden ver todos los roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles safe" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles safe" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles safe" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles safe" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin@admin.com to access all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read roles for admin functions" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to see their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles simple" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;

-- Paso 3: Crear políticas limpias y efectivas

-- Política 1: Permitir acceso completo a admin@admin.com
CREATE POLICY "admin_email_full_access" ON public.user_roles
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

-- Política 2: Permitir a usuarios con rol admin/owner gestionar roles
CREATE POLICY "admin_owner_manage_roles" ON public.user_roles
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

-- Política 3: Permitir a usuarios ver sus propios roles
CREATE POLICY "users_view_own_roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Política 4: Permitir al service role acceso completo (para funciones SECURITY DEFINER)
CREATE POLICY "service_role_full_access" ON public.user_roles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Paso 4: Otorgar permisos necesarios
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Paso 5: Comentario para documentar el cambio
COMMENT ON TABLE public.user_roles IS 'Tabla de roles de usuario con RLS habilitado. Las funciones SECURITY DEFINER pueden acceder sin restricciones.';
