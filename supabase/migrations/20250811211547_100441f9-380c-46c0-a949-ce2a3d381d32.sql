-- 1) Remove risky email-based bypasses and normalize functions

-- Drop function that directly manipulates auth.users (avoid permissions issues and misuse)
DROP FUNCTION IF EXISTS public.verify_admin_email();

-- Replace is_whatsapp_admin to be role-based only (no auth.users access)
CREATE OR REPLACE FUNCTION public.is_whatsapp_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
  );
END;
$$;

-- Unify get_users_with_roles_secure signature and remove email-based bypass
DROP FUNCTION IF EXISTS public.get_users_with_roles_secure();
CREATE OR REPLACE FUNCTION public.get_users_with_roles_secure()
RETURNS TABLE(id uuid, email text, display_name text, role text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only privileged roles may call
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

-- Ensure get_my_permissions exists and returns only current user's allowed permissions
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


-- 2) Role permissions RLS hardening
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='role_permissions' AND policyname='role_permissions_admin_all'
  ) THEN
    EXECUTE 'DROP POLICY "role_permissions_admin_all" ON public.role_permissions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='role_permissions' AND policyname='role_permissions_select_own_role'
  ) THEN
    EXECUTE 'DROP POLICY "role_permissions_select_own_role" ON public.role_permissions';
  END IF;
END $$;

CREATE POLICY "role_permissions_admin_all" ON public.role_permissions
FOR ALL
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());

CREATE POLICY "role_permissions_select_own_role" ON public.role_permissions
FOR SELECT
USING (role = public.get_current_user_role_secure());


-- 3) Tighten alertas_sistema_nacional read access (remove public read)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='alertas_sistema_nacional' AND policyname='alertas_all_read'
  ) THEN
    EXECUTE 'DROP POLICY "alertas_all_read" ON public.alertas_sistema_nacional';
  END IF;
END $$;

CREATE POLICY "alertas_authenticated_read" ON public.alertas_sistema_nacional
FOR SELECT USING (auth.uid() IS NOT NULL);


-- 4) Replace permissive ALL policies on activos_monitoreo and analisis_riesgo
-- activos_monitoreo
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='activos_monitoreo' AND policyname='Usuarios autenticados pueden acceder a activos_monitoreo'
  ) THEN
    EXECUTE 'DROP POLICY "Usuarios autenticados pueden acceder a activos_monitoreo" ON public.activos_monitoreo';
  END IF;
END $$;

CREATE POLICY "activos_select_auth" ON public.activos_monitoreo
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "activos_insert_restricted" ON public.activos_monitoreo
FOR INSERT
WITH CHECK (
  public.user_has_role_direct('coordinador_operaciones') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
);

CREATE POLICY "activos_update_restricted" ON public.activos_monitoreo
FOR UPDATE
USING (
  public.user_has_role_direct('coordinador_operaciones') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
)
WITH CHECK (
  public.user_has_role_direct('coordinador_operaciones') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
);

CREATE POLICY "activos_delete_admin" ON public.activos_monitoreo
FOR DELETE
USING (public.user_has_role_direct('admin') OR public.user_has_role_direct('owner'));

-- analisis_riesgo
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='analisis_riesgo' AND policyname='Usuarios autenticados pueden acceder a analisis_riesgo'
  ) THEN
    EXECUTE 'DROP POLICY "Usuarios autenticados pueden acceder a analisis_riesgo" ON public.analisis_riesgo';
  END IF;
END $$;

CREATE POLICY "analisis_select_roles" ON public.analisis_riesgo
FOR SELECT USING (
  public.user_has_role_direct('analista_seguridad') OR 
  public.user_has_role_direct('jefe_seguridad') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
);

CREATE POLICY "analisis_insert_analysts" ON public.analisis_riesgo
FOR INSERT
WITH CHECK (
  public.user_has_role_direct('analista_seguridad') OR 
  public.user_has_role_direct('jefe_seguridad') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
);

CREATE POLICY "analisis_update_analysts" ON public.analisis_riesgo
FOR UPDATE
USING (
  public.user_has_role_direct('analista_seguridad') OR 
  public.user_has_role_direct('jefe_seguridad') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
)
WITH CHECK (
  public.user_has_role_direct('analista_seguridad') OR 
  public.user_has_role_direct('jefe_seguridad') OR 
  public.user_has_role_direct('admin') OR 
  public.user_has_role_direct('owner')
);

CREATE POLICY "analisis_delete_admin" ON public.analisis_riesgo
FOR DELETE
USING (public.user_has_role_direct('admin') OR public.user_has_role_direct('owner'));


-- 5) Harden get_rewards_bypass_rls with role check
CREATE OR REPLACE FUNCTION public.get_rewards_bypass_rls()
RETURNS SETOF public.rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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


-- 6) Create audit table for API credential operations (no secrets stored)
CREATE TABLE IF NOT EXISTS public.audit_api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_name text NOT NULL,
  action text NOT NULL DEFAULT 'create',
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_api_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_api_admin_all" ON public.audit_api_credentials;
CREATE POLICY "audit_api_admin_all" ON public.audit_api_credentials
FOR ALL
USING (public.is_admin_user_secure())
WITH CHECK (public.is_admin_user_secure());