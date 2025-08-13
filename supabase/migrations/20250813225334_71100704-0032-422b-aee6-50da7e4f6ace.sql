-- CRITICAL SECURITY FIXES - Phase 1: Database Security
-- Remove hardcoded bypasses and secure publicly accessible tables

-- 1. Secure publicly accessible business intelligence tables with proper RLS policies

-- Secure servicios_segmentados table - restrict to BI roles only
CREATE POLICY "servicios_segmentados_restricted_access" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- Secure zonas_operacion_nacional table - restrict to operations roles
CREATE POLICY "zonas_operacion_restricted_access" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'bi')
  )
);

-- Secure subcategorias_gastos table - restrict to supply admin roles
CREATE POLICY "subcategorias_gastos_restricted_access" 
ON public.subcategorias_gastos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

-- 2. Secure vehicle information tables to authenticated users only
CREATE POLICY "marcas_vehiculos_authenticated_only" 
ON public.marcas_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "modelos_vehiculos_authenticated_only" 
ON public.modelos_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Secure reward system data to prevent competitive intelligence gathering
CREATE POLICY "rewards_authenticated_access" 
ON public.rewards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Update database functions to remove hardcoded bypasses and add proper search_path

-- Update is_admin_user_secure function to remove hardcoded bypass
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

-- Update is_super_admin function to remove hardcoded bypass
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

-- Update can_access_recruitment_data function to remove hardcoded bypass
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

-- Update current_user_has_role function with proper search_path
CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = role_name
  );
END;
$$;

-- Update can_manage_wms function with proper search_path
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
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
  );
END;
$$;

-- Update get_available_roles_secure function with proper search_path
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admin and owner can access available roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN ARRAY[
    'admin', 'owner', 'supply_admin', 'bi', 'manager', 
    'monitoring_supervisor', 'monitoring', 'supply', 'custodio', 
    'coordinador_operaciones', 'ejecutivo_ventas', 'soporte'
  ];
END;
$$;

-- 5. Create additional security functions for better access control

-- Function to check if user has monitoring access
CREATE OR REPLACE FUNCTION public.can_access_monitoring()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'monitoring', 'monitoring_supervisor', 'coordinador_operaciones')
  );
END;
$$;

-- Function to check if user has security analyst access
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

-- Function to check if user is coordinator or admin
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

-- 6. Enable RLS on tables that don't have it enabled yet
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_vehiculos ENABLE ROW LEVEL SECURITY;

-- 7. Log this security update for audit purposes
INSERT INTO public.audit_log_productos (
  usuario_id,
  accion,
  producto_id,
  motivo,
  datos_nuevos
) VALUES (
  auth.uid(),
  'SECURITY_UPDATE',
  gen_random_uuid(),
  'Critical security fixes applied',
  jsonb_build_object(
    'changes', 'Removed hardcoded bypasses, secured BI tables, added proper RLS policies',
    'timestamp', now(),
    'severity', 'critical'
  )
);