-- Add 'supply' role to has_supply_role() helper function
CREATE OR REPLACE FUNCTION public.has_supply_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','supply_admin','supply_lead','supply','coordinador_operaciones'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;