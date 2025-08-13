-- Phase 1: Remove hardcoded admin bypasses and secure business intelligence data
-- Phase 2: Add missing search_path to database functions  
-- Phase 3: Secure sensitive business intelligence tables

-- Remove hardcoded admin email bypass and secure business intelligence tables
-- Restrict access to sensitive BI tables to authorized roles only

-- Secure servicios_segmentados table
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicios_segmentados_public_read" ON public.servicios_segmentados;

CREATE POLICY "servicios_segmentados_bi_admin_access" 
ON public.servicios_segmentados 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

CREATE POLICY "servicios_segmentados_admin_manage" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Secure zonas_operacion_nacional table
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zonas_operacion_nacional_public_read" ON public.zonas_operacion_nacional;

CREATE POLICY "zonas_operacion_nacional_operational_access" 
ON public.zonas_operacion_nacional 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
  )
);

CREATE POLICY "zonas_operacion_nacional_admin_manage" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Secure criterios_evaluacion_financiera table (already has some policies, but ensure they're strict)
DROP POLICY IF EXISTS "Todos pueden ver criterios de evaluación" ON public.criterios_evaluacion_financiera;

CREATE POLICY "criterios_evaluacion_financiera_restricted_read" 
ON public.criterios_evaluacion_financiera 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

-- Secure ml_model_configurations table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ml_model_configurations') THEN
    EXECUTE 'ALTER TABLE public.ml_model_configurations ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "ml_model_configurations_public_read" ON public.ml_model_configurations';
    
    EXECUTE 'CREATE POLICY "ml_model_configurations_technical_access" 
    ON public.ml_model_configurations 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN (''admin'', ''owner'', ''supply_admin'')
      )
    )';
    
    EXECUTE 'CREATE POLICY "ml_model_configurations_admin_manage" 
    ON public.ml_model_configurations 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() 
        AND role IN (''admin'', ''owner'')
      )
    )';
  END IF;
END $$;

-- Update database functions to remove hardcoded bypasses and add missing search_path
-- Fix is_admin_user_secure function to remove hardcoded bypass
CREATE OR REPLACE FUNCTION public.is_admin_user_secure()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove hardcoded admin email bypass for security
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Fix is_super_admin function to remove hardcoded bypass
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove hardcoded admin email bypass for security
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  );
END;
$$;

-- Add missing search_path to existing functions that don't have it
CREATE OR REPLACE FUNCTION public.get_user_roles_safe()
RETURNS TABLE(role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ur.role 
  FROM public.user_roles ur
  ORDER BY ur.role;
END;
$$;

-- Update any function that might have hardcoded admin checks
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
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  );
END;
$$;

-- Create audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  operation text,
  record_id uuid DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log_productos (
    usuario_id,
    accion,
    producto_id,
    motivo,
    datos_nuevos,
    direccion_ip
  ) VALUES (
    auth.uid(),
    operation || ' on ' || table_name,
    COALESCE(record_id, gen_random_uuid()),
    'Sensitive data access audit',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'timestamp', now(),
      'user_id', auth.uid(),
      'additional_data', additional_data
    ),
    inet_client_addr()
  );
END;
$$;

-- Create function to check if current user has role without recursion
CREATE OR REPLACE FUNCTION public.current_user_has_role(check_role text)
RETURNS boolean
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