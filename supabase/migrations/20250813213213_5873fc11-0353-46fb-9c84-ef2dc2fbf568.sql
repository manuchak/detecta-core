-- Fix the parameter issue by dropping and recreating the function
DROP FUNCTION IF EXISTS public.is_admin_no_recursion(uuid);

-- Function to check admin without recursion (for servicios_custodia)
CREATE OR REPLACE FUNCTION public.is_admin_no_recursion(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
    AND role IN ('admin', 'owner', 'manager')
  );
END;
$$;

-- Now fix the servicios_custodia policies
DROP POLICY IF EXISTS "servicios_custodia_authenticated_read" ON public.servicios_custodia;

CREATE POLICY "Servicios custodia acceso controlado" 
ON public.servicios_custodia 
FOR SELECT 
USING (
  -- Admin and management can see all
  is_admin_bypass_rls()
  -- Custodians can see their own services (by phone or custodio ID)
  OR (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND (p.phone = servicios_custodia.telefono OR p.phone = servicios_custodia.telefono_operador)
    )
  )
  -- Or by custodio ID match
  OR id_custodio = auth.uid()::text
);

-- Create policy for servicios_custodia modifications - restrict to admin only
CREATE POLICY "Servicios custodia modificacion restringida" 
ON public.servicios_custodia 
FOR UPDATE 
USING (is_admin_bypass_rls())
WITH CHECK (is_admin_bypass_rls());

CREATE POLICY "Servicios custodia insercion restringida" 
ON public.servicios_custodia 
FOR INSERT 
WITH CHECK (is_admin_bypass_rls());

CREATE POLICY "Servicios custodia borrado restringido" 
ON public.servicios_custodia 
FOR DELETE 
USING (is_admin_bypass_rls());

-- Complete missing functions from first migration
CREATE OR REPLACE FUNCTION public.get_user_roles_safe()
RETURNS TABLE(role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ur.role 
  FROM public.user_roles ur
  ORDER BY ur.role;
END;
$$;