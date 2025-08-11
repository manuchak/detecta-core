-- CRITICAL SECURITY FIX: Remove hardcoded email bypasses and secure database functions

-- 1. Fix configuracion_wms table RLS (currently has RLS enabled but no policies)
CREATE POLICY "Only admins can manage WMS configuration"
ON public.configuracion_wms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- 2. Create secure role-checking functions without hardcoded emails
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_role TEXT;
BEGIN
  SELECT role INTO found_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'bi' THEN 4
      WHEN 'monitoring' THEN 5
      WHEN 'supply' THEN 6
      WHEN 'custodio' THEN 7
      ELSE 10
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'unverified');
END;
$$;

-- 3. Create secure admin check function
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS BOOLEAN
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

-- 4. Create secure user role check function
CREATE OR REPLACE FUNCTION public.user_has_role_secure(check_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = check_role
  );
END;
$$;

-- 5. Replace bypass_rls_get_servicios to be user-specific instead of exposing all data
CREATE OR REPLACE FUNCTION public.get_user_servicios_secure(max_records INTEGER DEFAULT 100)
RETURNS SETOF servicios_custodia
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  user_phone_number TEXT;
  is_admin BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user is admin
  is_admin := public.is_admin_user_secure();
  
  IF is_admin THEN
    -- Admins can see all records
    RETURN QUERY 
    SELECT * FROM public.servicios_custodia
    ORDER BY fecha_hora_cita DESC NULLS LAST
    LIMIT max_records;
  ELSE
    -- Regular users only see their own records
    SELECT phone INTO user_phone_number
    FROM public.profiles
    WHERE id = current_user_id;
    
    IF user_phone_number IS NOT NULL THEN
      RETURN QUERY 
      SELECT * FROM public.servicios_custodia
      WHERE telefono = user_phone_number OR telefono_operador = user_phone_number
      ORDER BY fecha_hora_cita DESC NULLS LAST
      LIMIT max_records;
    END IF;
  END IF;
END;
$$;

-- 6. Fix database functions search paths for existing security definer functions
-- Update the most critical ones first

CREATE OR REPLACE FUNCTION public.check_admin_secure()
RETURNS BOOLEAN
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