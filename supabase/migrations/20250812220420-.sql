-- SECURITY HARDENING MIGRATION (retry with safe drops/guards)

-- 0) Drop conflicting function signature if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_users_with_roles_secure'
  ) THEN
    EXECUTE 'DROP FUNCTION public.get_users_with_roles_secure()';
  END IF;
END $$;

-- 1) Create secure RPCs used by the app hooks (admin-gated)
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
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.check_admin_secure() 
    OR public.user_has_role_direct('owner')
    OR public.user_has_role_direct('supply_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(p.display_name, p.email) as display_name,
    (
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = p.id
      ORDER BY CASE ur.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'supply_admin' THEN 3
        WHEN 'bi' THEN 4
        WHEN 'manager' THEN 5
        WHEN 'monitoring_supervisor' THEN 6
        WHEN 'monitoring' THEN 7
        WHEN 'supply' THEN 8
        WHEN 'custodio' THEN 9
        WHEN 'pending' THEN 10
        ELSE 11
      END
      LIMIT 1
    ) as role,
    p.created_at,
    p.last_login
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  valid_roles text[];
BEGIN
  IF NOT (
    public.check_admin_secure() 
    OR public.user_has_role_direct('owner')
    OR public.user_has_role_direct('supply_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  valid_roles := public.get_available_roles_secure();
  IF NOT (new_role = ANY(valid_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, new_role);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user_email_secure(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.check_admin_secure() 
    OR public.user_has_role_direct('owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  UPDATE public.profiles
  SET is_verified = true,
      updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or could not be updated.';
  END IF;

  RETURN true;
END;
$$;

-- 2) Lock down role_permissions (guard if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='role_permissions') THEN
    EXECUTE 'ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY';
    -- Drop all existing policies
    PERFORM 1;
    FOR policy_name IN 
      SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', policy_name);
    END LOOP;
    -- Recreate minimal policies
    EXECUTE $$
      CREATE POLICY role_permissions_select_admin ON public.role_permissions FOR SELECT
      USING ( public.check_admin_secure() OR public.user_has_role_direct('owner') );
    $$;
    EXECUTE $$
      CREATE POLICY role_permissions_modify_admin ON public.role_permissions FOR ALL
      USING ( public.check_admin_secure() OR public.user_has_role_direct('owner') )
      WITH CHECK ( public.check_admin_secure() OR public.user_has_role_direct('owner') );
    $$;
  END IF;
END $$;

-- 3) Harden sensitive tables from security scan (each guarded by existence checks)

-- Helper procedure-like block
DO $$
BEGIN
  -- metricas_reclutamiento
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='metricas_reclutamiento') THEN
    EXECUTE 'ALTER TABLE public.metricas_reclutamiento ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.metricas_reclutamiento FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='metricas_reclutamiento' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.metricas_reclutamiento', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY metricas_reclutamiento_select_authorized ON public.metricas_reclutamiento FOR SELECT
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('bi') OR public.user_has_role_direct('manager') OR public.user_has_role_direct('supply_admin')
      );
    $$;
    EXECUTE $$
      CREATE POLICY metricas_reclutamiento_modify_admins ON public.metricas_reclutamiento FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('supply_admin')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('supply_admin')
      );
    $$;
  END IF;

  -- metricas_operacionales_zona
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='metricas_operacionales_zona') THEN
    EXECUTE 'ALTER TABLE public.metricas_operacionales_zona ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.metricas_operacionales_zona FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='metricas_operacionales_zona' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.metricas_operacionales_zona', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY metricas_operacionales_select_authorized ON public.metricas_operacionales_zona FOR SELECT
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('bi')
      );
    $$;
    EXECUTE $$
      CREATE POLICY metricas_operacionales_modify_admins ON public.metricas_operacionales_zona FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      );
    $$;
  END IF;

  -- zonas_operacion_nacional
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='zonas_operacion_nacional') THEN
    EXECUTE 'ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.zonas_operacion_nacional FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='zonas_operacion_nacional' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.zonas_operacion_nacional', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY zonas_operacion_select_authorized ON public.zonas_operacion_nacional FOR SELECT
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('bi')
      );
    $$;
    EXECUTE $$
      CREATE POLICY zonas_operacion_modify_admins ON public.zonas_operacion_nacional FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      );
    $$;
  END IF;

  -- servicios_segmentados
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='servicios_segmentados') THEN
    EXECUTE 'ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.servicios_segmentados FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='servicios_segmentados' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.servicios_segmentados', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY servicios_segmentados_select_authorized ON public.servicios_segmentados FOR SELECT
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('bi')
      );
    $$;
    EXECUTE $$
      CREATE POLICY servicios_segmentados_modify_admins ON public.servicios_segmentados FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones')
      );
    $$;
  END IF;

  -- rewards
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='rewards') THEN
    EXECUTE 'ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.rewards FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='rewards' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.rewards', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY rewards_select_authenticated ON public.rewards FOR SELECT USING (auth.uid() IS NOT NULL);
    $$;
    EXECUTE $$
      CREATE POLICY rewards_modify_admins ON public.rewards FOR ALL
      USING ( public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager') )
      WITH CHECK ( public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager') );
    $$;
  END IF;
END $$;

-- 4) Tighten existing broad tables used in app (guarded)
DO $$
BEGIN
  -- configuracion_monitoreo
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='configuracion_monitoreo') THEN
    EXECUTE 'ALTER TABLE public.configuracion_monitoreo ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.configuracion_monitoreo FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='configuracion_monitoreo' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.configuracion_monitoreo', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY config_monitoreo_manage_authorized ON public.configuracion_monitoreo FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('monitoring_supervisor') OR public.user_has_role_direct('monitoring')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('monitoring_supervisor') OR public.user_has_role_direct('monitoring')
      );
    $$;
  END IF;

  -- contactos_emergencia_servicio
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='contactos_emergencia_servicio') THEN
    EXECUTE 'ALTER TABLE public.contactos_emergencia_servicio ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.contactos_emergencia_servicio FORCE ROW LEVEL SECURITY';
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='contactos_emergencia_servicio' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.contactos_emergencia_servicio', policy_name);
    END LOOP;
    EXECUTE $$
      CREATE POLICY contactos_emergencia_manage_authorized ON public.contactos_emergencia_servicio FOR ALL
      USING (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('monitoring_supervisor') OR public.user_has_role_direct('monitoring')
      ) WITH CHECK (
        public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('coordinador_operaciones') OR public.user_has_role_direct('monitoring_supervisor') OR public.user_has_role_direct('monitoring')
      );
    $$;
  END IF;
END $$;
