-- PASO 1: Eliminar políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "admin_owner_manage_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and sales can manage leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins can update leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Assigned users can update their leads" ON leads;
DROP POLICY IF EXISTS "Assigned users can view their leads" ON leads;
DROP POLICY IF EXISTS "Users can view leads assigned to them" ON leads;

-- PASO 2: Crear políticas simples y funcionales sin recursión
-- Política segura para user_roles sin recursión
CREATE POLICY "admin_email_can_manage_user_roles" ON user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@admin.com'
  )
);

-- PASO 3: Políticas simplificadas para leads
-- Permitir acceso completo a usuarios autenticados por ahora (temporal)
CREATE POLICY "authenticated_users_full_access_leads" ON leads
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PASO 4: Función helper sin recursión para verificar admin
CREATE OR REPLACE FUNCTION is_admin_user_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'admin@admin.com'
  );
$$;