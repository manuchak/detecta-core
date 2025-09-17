-- Allow managers to read all user_roles
CREATE POLICY user_roles_manage_leads_read
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.can_manage_lead_assignments());

-- Allow managers to read all profiles (for team management views)
CREATE POLICY profiles_manage_leads_read
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_manage_lead_assignments());