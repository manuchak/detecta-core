-- Crear función robusta para verificar acceso de supply_admin específicamente
CREATE OR REPLACE FUNCTION public.is_supply_admin_or_higher()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar si es admin@admin.com directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar roles con privilegios altos incluyendo supply_admin
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id 
    AND role IN ('owner', 'admin', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi')
  );
END;
$$;

-- Función específica para garantizar acceso a la página de inicio
CREATE OR REPLACE FUNCTION public.can_access_home()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Si está autenticado, puede acceder a home
  RETURN current_user_id IS NOT NULL;
END;
$$;

-- Actualizar get_current_user_role para ser más robusto
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  found_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verificar si es admin@admin.com directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
  -- Buscar rol con manejo robusto de errores
  BEGIN
    SELECT role INTO found_role 
    FROM public.user_roles 
    WHERE user_id = current_user_id
    ORDER BY
      CASE role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'supply_admin' THEN 3
        WHEN 'coordinador_operaciones' THEN 4
        WHEN 'jefe_seguridad' THEN 5
        WHEN 'analista_seguridad' THEN 6
        WHEN 'supply_lead' THEN 7
        WHEN 'ejecutivo_ventas' THEN 8
        WHEN 'bi' THEN 9
        WHEN 'monitoring_supervisor' THEN 10
        WHEN 'monitoring' THEN 11
        WHEN 'supply' THEN 12
        WHEN 'instalador' THEN 13
        WHEN 'soporte' THEN 14
        WHEN 'custodio' THEN 15
        ELSE 16
      END
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Si hay error, buscar cualquier rol
    SELECT role INTO found_role 
    FROM public.user_roles 
    WHERE user_id = current_user_id
    LIMIT 1;
  END;
  
  -- Si aún no encuentra rol, verificar por email específicos de supply_admin
  IF found_role IS NULL THEN
    IF user_email IN ('brenda.jimenez@detectasecurity.io', 'marbelli.casillas@detectasecurity.io') THEN
      found_role := 'supply_admin';
    END IF;
  END IF;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;