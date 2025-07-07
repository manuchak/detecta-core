
-- FASE 1: LIMPIEZA DE FUNCIONES DUPLICADAS Y OBSOLETAS
-- Estrategia de Seguridad: Consolidación de funciones sin afectar funcionalidad

-- PASO 1: Eliminar funciones duplicadas y obsoletas que causan confusión
-- Mantener solo las funciones que están siendo utilizadas actualmente

-- Eliminar funciones obsoletas de verificación de admin
DROP FUNCTION IF EXISTS public.is_admin_bypass_rls();
DROP FUNCTION IF EXISTS public.verificar_admin_seguro(uuid);
DROP FUNCTION IF EXISTS public.es_usuario_admin(uuid);
DROP FUNCTION IF EXISTS public.es_usuario_admin();

-- Eliminar funciones duplicadas de roles de usuario
DROP FUNCTION IF EXISTS public.get_user_roles_safe();
DROP FUNCTION IF EXISTS public.get_all_user_roles_safe();

-- PASO 2: Consolidar funciones de seguridad críticas
-- Crear una función principal para verificar administradores (sin recursión)
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificación directa de admin@admin.com
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificación de roles sin recursión
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- PASO 3: Optimizar función get_users_with_roles_secure para evitar problemas CORS
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  role text,
  created_at timestamp with time zone,
  last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar que el usuario actual es administrador usando función segura
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.display_name, p.email) as display_name,
    ur.role,
    p.created_at,
    p.last_login
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'owner', 'manager', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad')
  ORDER BY p.display_name;
END;
$$;

-- PASO 4: Limpiar políticas conflictivas en la tabla leads
-- Mantener solo la política más específica y segura
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar leads" ON public.leads;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear leads" ON public.leads;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver leads" ON public.leads;

-- Mantener solo la política consolidada que ya funciona
-- (La política "authenticated_users_full_access_leads" se mantendrá por ahora para no romper funcionalidad)

-- PASO 5: Crear función segura para obtener roles disponibles
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS TABLE(role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar permisos de administrador
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT ur.role
  FROM public.user_roles ur
  WHERE ur.role IN (
    'owner', 'admin', 'supply_admin', 'coordinador_operaciones',
    'jefe_seguridad', 'analista_seguridad', 'supply_lead',
    'ejecutivo_ventas', 'custodio', 'bi', 'monitoring_supervisor',
    'monitoring', 'supply', 'instalador', 'soporte', 'pending', 'unverified'
  )
  ORDER BY ur.role;
END;
$$;

-- PASO 6: Función segura para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'unverified');
END;
$$;

-- PASO 7: Comentarios de documentación para las funciones críticas
COMMENT ON FUNCTION public.is_admin_user_secure() IS 'Función segura para verificar si el usuario actual es administrador. Previene recursión RLS.';
COMMENT ON FUNCTION public.get_users_with_roles_secure() IS 'Función segura para obtener usuarios con roles. Solo accesible por administradores.';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Función segura para obtener el rol del usuario actual sin recursión.';
