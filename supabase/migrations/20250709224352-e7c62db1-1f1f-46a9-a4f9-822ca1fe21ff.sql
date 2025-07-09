-- Primero eliminar políticas problemáticas que causan recursión
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Crear función segura para verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
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

-- Función para verificar role específico sin recursión
CREATE OR REPLACE FUNCTION public.user_has_role_direct(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
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

-- Crear políticas nuevas sin recursión usando las funciones security definer
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin_user_secure());

-- Conceder permisos a las funciones
GRANT EXECUTE ON FUNCTION public.is_admin_user_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_direct(text) TO authenticated;