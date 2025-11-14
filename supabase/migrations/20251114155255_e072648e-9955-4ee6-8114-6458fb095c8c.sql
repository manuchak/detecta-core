-- ================================================================
-- FIX CRÍTICO: Eliminar recursión infinita en RLS
-- Convertir funciones de LANGUAGE plpgsql a LANGUAGE sql
-- ================================================================

-- 1. Recrear can_manage_lead_assignments() con LANGUAGE sql
-- Esto evita recursión porque PostgreSQL optimiza la query completa
CREATE OR REPLACE FUNCTION public.can_manage_lead_assignments()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  );
$$;

-- 2. Recrear get_users_with_roles_secure() con LANGUAGE sql
-- Usar CTE para verificar permisos en una sola query sin recursión
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Verificar permisos y retornar datos en una sola query optimizada
  WITH user_permissions AS (
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager', 'supply_admin', 'supply_lead')
    ) AS has_access
  )
  SELECT 
    p.id,
    p.email,
    p.display_name,
    ur.role::text
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  CROSS JOIN user_permissions up
  WHERE ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
    AND up.has_access = true
  ORDER BY p.display_name;
$$;

-- 3. Verificar que las funciones se crearon correctamente
DO $$
BEGIN
  -- Verificar can_manage_lead_assignments
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'can_manage_lead_assignments' 
    AND prolang = (SELECT oid FROM pg_language WHERE lanname = 'sql')
  ) THEN
    RAISE NOTICE '✅ can_manage_lead_assignments convertida a SQL';
  ELSE
    RAISE EXCEPTION '❌ Error en can_manage_lead_assignments';
  END IF;

  -- Verificar get_users_with_roles_secure
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_users_with_roles_secure' 
    AND prolang = (SELECT oid FROM pg_language WHERE lanname = 'sql')
  ) THEN
    RAISE NOTICE '✅ get_users_with_roles_secure convertida a SQL';
  ELSE
    RAISE EXCEPTION '❌ Error en get_users_with_roles_secure';
  END IF;
END $$;

COMMENT ON FUNCTION public.can_manage_lead_assignments() IS 
'Verifica si el usuario actual puede gestionar asignaciones de leads. Usa LANGUAGE sql para evitar recursión RLS.';

COMMENT ON FUNCTION public.get_users_with_roles_secure() IS 
'Retorna usuarios con roles específicos para asignación de leads. Usa LANGUAGE sql con CTE para evitar recursión RLS.';