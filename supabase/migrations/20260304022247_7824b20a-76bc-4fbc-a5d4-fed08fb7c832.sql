-- Step 1: Create SECURITY DEFINER function to bypass RLS on user_roles
CREATE OR REPLACE FUNCTION public.has_cs_management_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','customer_success','ejecutivo_ventas',
                         'coordinador_operaciones','planificador','bi'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- Step 2: Drop recursive policy and recreate using the function
DROP POLICY IF EXISTS "cs_roles_read_user_roles" ON public.user_roles;

CREATE POLICY "cs_roles_read_user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_cs_management_role());