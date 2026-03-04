
-- Re-create has_lms_admin_role (was lost when first migration failed partially)
CREATE OR REPLACE FUNCTION public.has_lms_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin')
      AND is_active = true
  )
$$;
