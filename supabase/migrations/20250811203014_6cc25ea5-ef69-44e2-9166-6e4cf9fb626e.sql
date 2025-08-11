-- Strengthen RLS on role_permissions and remove email-based privilege bypasses; add user-scoped permissions RPC

-- 1) Enable and enforce RLS on role_permissions with safe policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'role_permissions'
  ) THEN
    EXECUTE 'ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.role_permissions FORCE ROW LEVEL SECURITY';

    -- Admins/owners can select all
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_select_admins'
    ) THEN
      EXECUTE $$
        CREATE POLICY role_permissions_select_admins
        ON public.role_permissions
        FOR SELECT
        TO authenticated
        USING (public.is_admin_user_secure() OR public.user_has_role_direct('owner'))
      $$;
    END IF;

    -- Any authenticated user can read only their effective role rows
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_select_self_role'
    ) THEN
      EXECUTE $$
        CREATE POLICY role_permissions_select_self_role
        ON public.role_permissions
        FOR SELECT
        TO authenticated
        USING (role = public.get_current_user_role_secure())
      $$;
    END IF;

    -- Only admins/owners can insert/update/delete
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'role_permissions' AND policyname = 'role_permissions_modify_admins'
    ) THEN
      EXECUTE $$
        CREATE POLICY role_permissions_modify_admins
        ON public.role_permissions
        FOR ALL
        TO authenticated
        USING (public.is_admin_user_secure() OR public.user_has_role_direct('owner'))
        WITH CHECK (public.is_admin_user_secure() OR public.user_has_role_direct('owner'))
      $$;
    END IF;
  END IF;
END $$;

-- 2) Create a user-scoped permissions RPC (returns only current user's role permissions)
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE(
  id uuid,
  permission_type text,
  permission_id text,
  allowed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_role text;
BEGIN
  current_role := public.get_current_user_role_secure();

  RETURN QUERY
  SELECT rp.id, rp.permission_type, rp.permission_id, rp.allowed
  FROM public.role_permissions rp
  WHERE rp.role = current_role
  ORDER BY rp.permission_type, rp.permission_id;
END;
$$;

-- 3) Remove email-based bypass from is_whatsapp_admin()
CREATE OR REPLACE FUNCTION public.is_whatsapp_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only role-based checks
  RETURN public.is_admin_user_secure() OR public.user_has_role_direct('manager');
END;
$$;

-- 4) Remove email-based bypass from get_users_with_roles_secure()
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(id uuid, email text, display_name text, role text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict role-based access only
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role IN (
        'admin', 'owner', 'supply_admin', 'supply_lead',
        'supply', 'analista_seguridad', 'custodio',
        'coordinador_operaciones', 'jefe_seguridad'
      )
  ) THEN
    RAISE EXCEPTION 'Access denied. Insufficient privileges.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.display_name, p.email) as display_name,
    ur.role,
    p.created_at
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role IN (
    'admin', 'owner', 'supply_admin', 'supply_lead', 'supply',
    'analista_seguridad', 'custodio', 'coordinador_operaciones', 'jefe_seguridad'
  )
  ORDER BY p.email;
END;
$$;