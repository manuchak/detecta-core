-- Secure the leads table: enable RLS and restrict access to authorized sales roles only

-- 0) Drop all existing policies on leads to remove public access
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'leads'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
  END LOOP;
END $$;

-- 1) Enable Row Level Security on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2) Create clean policies for authorized roles only

-- Helper comment: authorized roles are admin/owner, supply_admin, supply_lead, ejecutivo_ventas

-- SELECT policy
CREATE POLICY leads_select_sales_only
ON public.leads
FOR SELECT
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
);

-- INSERT policy
CREATE POLICY leads_insert_sales_only
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
);

-- UPDATE policy
CREATE POLICY leads_update_sales_only
ON public.leads
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
)
WITH CHECK (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
);

-- DELETE policy
CREATE POLICY leads_delete_sales_only
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
);
