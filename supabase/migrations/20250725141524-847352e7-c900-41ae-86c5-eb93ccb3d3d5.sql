-- Phase 1 (Batch 3/5): Fixing remaining structural errors in SQL functions
-- Adding SECURITY DEFINER and SET search_path TO 'public' for security compliance

-- Fix get_users_with_roles_for_admin function
CREATE OR REPLACE FUNCTION public.get_users_with_roles_for_admin()
 RETURNS TABLE(user_id uuid, email text, role text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Solo permitir a administradores
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para ver esta información';
  END IF;

  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email,
    ur.role,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  ORDER BY au.email;
END;
$function$;

-- Fix user_has_role_direct function
CREATE OR REPLACE FUNCTION public.user_has_role_direct(role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix update_user_role_by_email function
CREATE OR REPLACE FUNCTION public.update_user_role_by_email(p_email text, p_new_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Solo permitir a administradores
  IF NOT public.is_admin_user_secure() THEN
    RAISE EXCEPTION 'Sin permisos para actualizar roles';
  END IF;

  -- Buscar el user_id por email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', p_email;
  END IF;

  -- Eliminar rol existente
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insertar nuevo rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, p_new_role);

  RETURN true;
END;
$function$;

-- Fix is_whatsapp_admin function
CREATE OR REPLACE FUNCTION public.is_whatsapp_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si es admin@admin.com directamente desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$function$;

-- Fix get_user_roles function
CREATE OR REPLACE FUNCTION public.get_user_roles()
 RETURNS TABLE(role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid();
END;
$function$;

-- Fix es_usuario_admin with user_id parameter function
CREATE OR REPLACE FUNCTION public.es_usuario_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar si el usuario tiene rol de admin, owner o manager
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;

-- Fix verificar_admin_seguro function
CREATE OR REPLACE FUNCTION public.verificar_admin_seguro(check_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificación directa sin triggers RLS
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id 
    AND (role = 'admin' OR role = 'owner' OR role = 'manager')
  );
END;
$function$;