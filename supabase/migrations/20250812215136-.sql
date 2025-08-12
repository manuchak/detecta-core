-- Secure metricas_canales table with RLS and least-privilege policies

-- Enable Row Level Security and enforce it
ALTER TABLE public.metricas_canales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_canales FORCE ROW LEVEL SECURITY;

-- Drop any existing policies on this table to remove overly-permissive access
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='metricas_canales'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.metricas_canales', pol.policyname);
  END LOOP;
END $$;

-- Allow SELECT only to authorized roles (admin/owner/bi/supply_admin/manager)
CREATE POLICY "metricas_canales_select_authorized"
ON public.metricas_canales
FOR SELECT
USING (
  check_admin_secure() 
  OR user_has_role_direct('owner')
  OR user_has_role_direct('bi')
  OR user_has_role_direct('supply_admin')
  OR user_has_role_direct('manager')
);

-- Allow INSERT only to admins/owners/supply_admins
CREATE POLICY "metricas_canales_insert_admins"
ON public.metricas_canales
FOR INSERT
WITH CHECK (
  check_admin_secure()
  OR user_has_role_direct('owner')
  OR user_has_role_direct('supply_admin')
);

-- Allow UPDATE only to admins/owners/supply_admins
CREATE POLICY "metricas_canales_update_admins"
ON public.metricas_canales
FOR UPDATE
USING (
  check_admin_secure()
  OR user_has_role_direct('owner')
  OR user_has_role_direct('supply_admin')
)
WITH CHECK (
  check_admin_secure()
  OR user_has_role_direct('owner')
  OR user_has_role_direct('supply_admin')
);

-- Allow DELETE only to admins/owners/supply_admins
CREATE POLICY "metricas_canales_delete_admins"
ON public.metricas_canales
FOR DELETE
USING (
  check_admin_secure()
  OR user_has_role_direct('owner')
  OR user_has_role_direct('supply_admin')
);
