-- Secure the leads table: enable RLS and restrict access to authorized sales roles only

-- 1) Enable Row Level Security on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2) Add RESTRICTIVE policies (ANDed with any permissive ones) to prevent public reads
--    Authorized roles: admin/owner (via is_admin_user_secure), supply_admin, supply_lead, ejecutivo_ventas

-- SELECT policy
CREATE POLICY leads_restrict_select_sales_only
AS RESTRICTIVE
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
CREATE POLICY leads_restrict_insert_sales_only
AS RESTRICTIVE
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
CREATE POLICY leads_restrict_update_sales_only
AS RESTRICTIVE
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
CREATE POLICY leads_restrict_delete_sales_only
AS RESTRICTIVE
ON public.leads
FOR DELETE
TO authenticated
USING (
  public.is_admin_user_secure()
  OR public.user_has_role_direct('supply_admin')
  OR public.user_has_role_direct('supply_lead')
  OR public.user_has_role_direct('ejecutivo_ventas')
);
