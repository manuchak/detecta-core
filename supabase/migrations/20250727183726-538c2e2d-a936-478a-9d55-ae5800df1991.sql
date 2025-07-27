-- Phase 4B: Fix function parameter conflicts and continue with search_path corrections

-- Drop conflicting functions first
DROP FUNCTION IF EXISTS public.calculate_custodian_level(integer);
DROP FUNCTION IF EXISTS public.award_points(UUID, TEXT, INTEGER, TEXT, TEXT);

-- Continue with function corrections
CREATE OR REPLACE FUNCTION public.create_new_role(new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Verificar que el rol no existe
  IF EXISTS (SELECT 1 FROM user_roles WHERE role = new_role) THEN
    RAISE EXCEPTION 'Role already exists: %', new_role;
  END IF;

  -- El rol se creará cuando se asigne a un usuario
  -- Por ahora solo validamos que es un rol válido
  IF new_role NOT IN ('admin', 'manager', 'custodio', 'supply', 'monitoring') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_role_name(old_role TEXT, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Actualizar el rol
  UPDATE user_roles
  SET role = new_role
  WHERE role = old_role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_role(target_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- No permitir eliminar roles críticos
  IF target_role IN ('admin', 'owner') THEN
    RAISE EXCEPTION 'Cannot delete critical role: %', target_role;
  END IF;

  -- Verificar si hay usuarios con este rol
  IF EXISTS (SELECT 1 FROM user_roles WHERE role = target_role) THEN
    RAISE EXCEPTION 'Cannot delete role with assigned users: %', target_role;
  END IF;

  -- El rol se eliminará automáticamente cuando no haya usuarios asignados
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS TABLE(role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar que el usuario es admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ur.role
  FROM user_roles ur
  UNION
  SELECT unnest(ARRAY['admin', 'manager', 'custodio', 'supply', 'monitoring'])
  ORDER BY role;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS BOOLEAN
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
  
  -- Verificar email admin directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
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
  
  -- Verificar email admin directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles de super admin
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_wms()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_security_analyst_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_user_is_coordinator_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    SELECT 1 FROM user_roles
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'jefe_seguridad')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_no_recursion(check_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar email admin directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = check_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles sin recursión
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_custodian_level(points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Niveles basados en puntos
  IF points >= 5000 THEN
    RETURN 5;  -- Custodio Elite
  ELSIF points >= 2000 THEN
    RETURN 4;  -- Custodio Experto
  ELSIF points >= 800 THEN
    RETURN 3;  -- Custodio Avanzado
  ELSIF points >= 300 THEN
    RETURN 2;  -- Custodio Intermedio
  ELSE
    RETURN 1;  -- Custodio Principiante
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_points(p_user_id UUID, p_service_id TEXT, p_points INTEGER, p_point_type TEXT, p_description TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insertar registro de puntos
  INSERT INTO point_transactions (
    user_id,
    service_id,
    points_awarded,
    point_type,
    description,
    created_at
  ) VALUES (
    p_user_id,
    p_service_id,
    p_points,
    p_point_type,
    p_description,
    now()
  );
  
  -- Actualizar total de puntos
  UPDATE custodio_points
  SET points = points + p_points,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Si no existe registro, crear uno
  IF NOT FOUND THEN
    INSERT INTO custodio_points (user_id, points)
    VALUES (p_user_id, p_points);
  END IF;
END;
$function$;