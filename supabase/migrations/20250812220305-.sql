-- SECURITY HARDENING MIGRATION
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
  -- Admin/owner/supply_admin only
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

-- Ensure only privileged roles can execute the function implicitly via RLS bypass (handled by SECURITY DEFINER + explicit checks)

CREATE OR REPLACE FUNCTION public.update_user_role_secure(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  valid_roles text[];
BEGIN
  -- Admin/owner/supply_admin only
  IF NOT (
    public.check_admin_secure() 
    OR public.user_has_role_direct('owner')
    OR public.user_has_role_direct('supply_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Validate role against allowed list
  valid_roles := public.get_available_roles_secure();
  IF NOT (new_role = ANY(valid_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Ensure user exists in profiles (avoid touching auth.users from client)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Replace existing roles with the new one (single primary role model)
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
  -- Admin/owner only
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

-- 2) Lock down role_permissions table to admins only (use RPC for reads/writes)
DO $$
BEGIN
  -- Enable and enforce RLS (safe if already enabled)
  EXECUTE 'ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY';
  -- Drop existing policies
  PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions';
  IF FOUND THEN
    FOR SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions' LOOP
    END LOOP;
  END IF;
EXCEPTION WHEN others THEN
  -- no-op to avoid migration abort if table/policies missing
  NULL;
END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='role_permissions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY role_permissions_select_admin
ON public.role_permissions
FOR SELECT
USING (
  public.check_admin_secure() OR public.user_has_role_direct('owner')
);

CREATE POLICY role_permissions_modify_admin
ON public.role_permissions
FOR ALL
USING (
  public.check_admin_secure() OR public.user_has_role_direct('owner')
)
WITH CHECK (
  public.check_admin_secure() OR public.user_has_role_direct('owner')
);

-- 3) Tighten sensitive tables flagged by security scan
-- Helper block to apply a standard hardening template

-- Metricas Reclutamiento
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.metricas_reclutamiento ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.metricas_reclutamiento FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='metricas_reclutamiento' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.metricas_reclutamiento', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY metricas_reclutamiento_select_authorized
ON public.metricas_reclutamiento
FOR SELECT
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('bi')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('supply_admin')
);

CREATE POLICY metricas_reclutamiento_modify_admins
ON public.metricas_reclutamiento
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('supply_admin')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('supply_admin')
);

-- Metricas Operacionales por Zona
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.metricas_operacionales_zona ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.metricas_operacionales_zona FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='metricas_operacionales_zona' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.metricas_operacionales_zona', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY metricas_operacionales_select_authorized
ON public.metricas_operacionales_zona
FOR SELECT
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('bi')
);

CREATE POLICY metricas_operacionales_modify_admins
ON public.metricas_operacionales_zona
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
);

-- Zonas de Operación Nacional
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.zonas_operacion_nacional FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='zonas_operacion_nacional' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.zonas_operacion_nacional', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY zonas_operacion_select_authorized
ON public.zonas_operacion_nacional
FOR SELECT
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('bi')
);

CREATE POLICY zonas_operacion_modify_admins
ON public.zonas_operacion_nacional
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
);

-- Servicios Segmentados
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.servicios_segmentados FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='servicios_segmentados' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.servicios_segmentados', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY servicios_segmentados_select_authorized
ON public.servicios_segmentados
FOR SELECT
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('manager')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('bi')
);

CREATE POLICY servicios_segmentados_modify_admins
ON public.servicios_segmentados
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
);

-- Rewards: restrict to authenticated users for reads; admin-only modifications
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.rewards FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='rewards' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rewards', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY rewards_select_authenticated
ON public.rewards
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY rewards_modify_admins
ON public.rewards
FOR ALL
USING (
  public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager')
)
WITH CHECK (
  public.check_admin_secure() OR public.user_has_role_direct('owner') OR public.user_has_role_direct('manager')
);

-- 4) Tighten existing overly broad tables used in app: configuracion_monitoreo & contactos_emergencia_servicio
-- configuracion_monitoreo: currently ALL for authenticated -> restrict to ops + admins
DO $$
DECLARE pol record;
BEGIN
  EXECUTE 'ALTER TABLE public.configuracion_monitoreo ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.configuracion_monitoreo FORCE ROW LEVEL SECURITY';
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='configuracion_monitoreo' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.configuracion_monitoreo', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY config_monitoreo_manage_authorized
ON public.configuracion_monitoreo
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
);

-- contactos_emergencia_servicio: restrict to ops + admins
DO $$
DECLARE pol record;
BEGIN
  EXECUTE 'ALTER TABLE public.contactos_emergencia_servicio ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.contactos_emergencia_servicio FORCE ROW LEVEL SECURITY';
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='contactos_emergencia_servicio' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contactos_emergencia_servicio', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY contactos_emergencia_manage_authorized
ON public.contactos_emergencia_servicio
FOR ALL
USING (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
)
WITH CHECK (
  public.check_admin_secure()
  OR public.user_has_role_direct('owner')
  OR public.user_has_role_direct('coordinador_operaciones')
  OR public.user_has_role_direct('monitoring_supervisor')
  OR public.user_has_role_direct('monitoring')
);
