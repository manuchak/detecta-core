-- Security hardening migration: RLS policies, RPCs, and function fixes

-- 1) Role permissions table RLS
DO $$
BEGIN
  -- Enable RLS (if not already)
  EXECUTE 'ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN
  -- ignore if table missing (will error); this migration assumes table exists
  NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'role_permissions'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.role_permissions;', ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions'
    );
  END IF;
END $$;

-- Admins (owner/admin) can do everything on role_permissions
CREATE POLICY rp_admin_all ON public.role_permissions
  FOR ALL
  USING (public.check_admin_secure() OR public.user_has_role_direct('owner'))
  WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('owner'));

-- Authenticated users can read only their current role's permissions
CREATE POLICY rp_user_read_current_role ON public.role_permissions
  FOR SELECT
  USING (role = public.get_current_user_role_secure());

-- 2) RPC to fetch current user's permissions only
CREATE OR REPLACE FUNCTION public.get_my_permissions()
RETURNS TABLE(
  id uuid,
  role text,
  permission_type text,
  permission_id text,
  allowed boolean,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.role,
    rp.permission_type,
    rp.permission_id,
    rp.allowed,
    rp.created_at,
    rp.updated_at
  FROM public.role_permissions rp
  WHERE rp.role = public.get_current_user_role_secure()
    AND rp.allowed = true
  ORDER BY rp.permission_type, rp.permission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = 'public';

-- 3) Harden get_rewards_bypass_rls to require admin/manager
CREATE OR REPLACE FUNCTION public.get_rewards_bypass_rls()
RETURNS SETOF public.rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT (public.is_admin_user_secure() OR public.user_has_role_direct('manager')) THEN
    RAISE EXCEPTION 'Access denied. Admin or manager required.';
  END IF;

  RETURN QUERY
  SELECT * FROM public.rewards
  ORDER BY featured DESC, point_cost ASC;
END;
$$;

-- 4) Remove email-based bypasses
-- is_whatsapp_admin: make it role-based only
CREATE OR REPLACE FUNCTION public.is_whatsapp_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
  );
END;
$$;

-- get_users_with_roles_secure: remove hardcoded email bypass
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(id uuid, email text, display_name text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Require privileged roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'analista_seguridad', 'coordinador_operaciones', 'jefe_seguridad')
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
  WHERE ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'analista_seguridad', 'custodio', 'coordinador_operaciones', 'jefe_seguridad')
  ORDER BY p.email;
END;
$$;

-- 5) RLS hardening: activos_monitoreo
ALTER TABLE public.activos_monitoreo ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activos_monitoreo'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.activos_monitoreo;', ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='activos_monitoreo'
    );
  END IF;
END $$;

-- SELECT for admin/ops/security roles
CREATE POLICY activos_monitoreo_select_priv ON public.activos_monitoreo
  FOR SELECT
  USING (
    public.check_admin_secure() 
    OR public.user_has_role_direct('coordinador_operaciones')
    OR public.user_has_role_direct('jefe_seguridad')
    OR public.user_has_role_direct('analista_seguridad')
  );

-- INSERT/UPDATE/DELETE restricted to admin or coordinador_operaciones
CREATE POLICY activos_monitoreo_modify_priv ON public.activos_monitoreo
  FOR ALL
  USING (
    public.check_admin_secure() 
    OR public.user_has_role_direct('coordinador_operaciones')
  )
  WITH CHECK (
    public.check_admin_secure() 
    OR public.user_has_role_direct('coordinador_operaciones')
  );

-- 6) RLS hardening: analisis_riesgo
ALTER TABLE public.analisis_riesgo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'analisis_riesgo'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.analisis_riesgo;', ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='analisis_riesgo'
    );
  END IF;
END $$;

CREATE POLICY analisis_riesgo_select_priv ON public.analisis_riesgo
  FOR SELECT
  USING (
    public.is_security_analyst_or_admin()
    OR public.user_has_role_direct('jefe_seguridad')
    OR public.user_has_role_direct('coordinador_operaciones')
  );

CREATE POLICY analisis_riesgo_insert_priv ON public.analisis_riesgo
  FOR INSERT
  WITH CHECK (public.is_security_analyst_or_admin());

CREATE POLICY analisis_riesgo_update_priv ON public.analisis_riesgo
  FOR UPDATE
  USING (public.is_security_analyst_or_admin() OR public.user_has_role_direct('jefe_seguridad'))
  WITH CHECK (public.is_security_analyst_or_admin() OR public.user_has_role_direct('jefe_seguridad'));

CREATE POLICY analisis_riesgo_delete_admin ON public.analisis_riesgo
  FOR DELETE
  USING (public.check_admin_secure());

-- 7) RLS: alertas_sistema_nacional tighten SELECT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'alertas_sistema_nacional' AND polname = 'alertas_all_read'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS alertas_all_read ON public.alertas_sistema_nacional;';
  END IF;
END $$;

CREATE POLICY alertas_all_read ON public.alertas_sistema_nacional
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep existing admin manage policy as-is

-- 8) RLS: contactos_emergencia_servicio - split by operation
ALTER TABLE public.contactos_emergencia_servicio ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contactos_emergencia_servicio'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.contactos_emergencia_servicio;', ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='contactos_emergencia_servicio'
    );
  END IF;
END $$;

CREATE POLICY contactos_emergencia_select_auth ON public.contactos_emergencia_servicio
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY contactos_emergencia_modify_priv ON public.contactos_emergencia_servicio
  FOR ALL
  USING (public.check_admin_secure() OR public.user_has_role_direct('coordinador_operaciones'))
  WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('coordinador_operaciones'));

-- 9) RLS: configuracion_monitoreo - split by operation
ALTER TABLE public.configuracion_monitoreo ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'configuracion_monitoreo'
  ) THEN
    EXECUTE (
      SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(polname) || ' ON public.configuracion_monitoreo;', ' ')
      FROM pg_policies WHERE schemaname='public' AND tablename='configuracion_monitoreo'
    );
  END IF;
END $$;

CREATE POLICY configuracion_monitoreo_select_auth ON public.configuracion_monitoreo
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY configuracion_monitoreo_modify_priv ON public.configuracion_monitoreo
  FOR ALL
  USING (public.check_admin_secure() OR public.user_has_role_direct('coordinador_operaciones'))
  WITH CHECK (public.check_admin_secure() OR public.user_has_role_direct('coordinador_operaciones'));
