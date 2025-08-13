-- Phase 2: Add missing security functions and strengthen existing policies
-- Create helper functions for better RLS policy management

-- Function to check if user has recruitment access
CREATE OR REPLACE FUNCTION public.can_access_recruitment_data()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  );
END;
$$;

-- Function to check management roles
CREATE OR REPLACE FUNCTION public.has_management_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'manager')
  );
END;
$$;

-- Function to check if user can manage WMS
CREATE OR REPLACE FUNCTION public.can_manage_wms()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
  );
END;
$$;

-- Function to check coordinator access
CREATE OR REPLACE FUNCTION public.current_user_is_coordinator_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  );
END;
$$;

-- Function to check security analyst access
CREATE OR REPLACE FUNCTION public.is_security_analyst_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'analista_seguridad', 'jefe_seguridad')
  );
END;
$$;

-- Function to check if user is super admin (for critical operations)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

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

-- Function to check admin secure
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid 
    AND role = role_name
  );
END;
$$;

-- Function to get available roles securely
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admin/owner can see all available roles
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN ARRAY[
    'admin', 'owner', 'supply_admin', 'coordinador_operaciones', 
    'jefe_seguridad', 'analista_seguridad', 'supply_lead', 
    'ejecutivo_ventas', 'custodio', 'bi', 'monitoring_supervisor', 
    'monitoring', 'supply', 'instalador', 'soporte', 'pending', 'unverified'
  ];
END;
$$;

-- Update servicios_custodia to use secure admin check to prevent recursion
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

-- Create policy for servicios_custodia modifications
CREATE POLICY "Servicios custodia modificacion restringida" 
ON public.servicios_custodia 
FOR ALL 
USING (is_admin_bypass_rls())
WITH CHECK (is_admin_bypass_rls());