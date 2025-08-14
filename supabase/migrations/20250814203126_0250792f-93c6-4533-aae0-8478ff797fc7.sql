-- PHASE 1: Secure Business Intelligence Tables (CRITICAL)
-- Remove overly permissive policies and add restrictive ones

-- Secure ml_model_configurations table
DROP POLICY IF EXISTS "Anyone can read ml_model_configurations" ON public.ml_model_configurations;

CREATE POLICY "BI data access restricted to authorized roles" 
ON public.ml_model_configurations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

CREATE POLICY "Only admins can modify ml_model_configurations" 
ON public.ml_model_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Secure servicios_segmentados table
DROP POLICY IF EXISTS "Anyone can read servicios_segmentados" ON public.servicios_segmentados;

CREATE POLICY "Segmented services access restricted" 
ON public.servicios_segmentados 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'coordinador_operaciones', 'monitoring_supervisor')
  )
);

CREATE POLICY "Only coordinators and admins can modify segmented services" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- Secure zonas_operacion_nacional table
DROP POLICY IF EXISTS "Anyone can read zonas_operacion_nacional" ON public.zonas_operacion_nacional;

CREATE POLICY "National operation zones access restricted" 
ON public.zonas_operacion_nacional 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor', 'jefe_seguridad')
  )
);

CREATE POLICY "Only authorized roles can modify operation zones" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- PHASE 2: Fix RLS Policy Conflicts - Remove duplicate/conflicting policies
-- Fix conflicting policies on candidatos_custodios table
DROP POLICY IF EXISTS "Candidatos para reclutadores autorizados" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_custodios_read_recruitment" ON public.candidatos_custodios;

-- Keep only the most restrictive and clear policy
CREATE POLICY "candidatos_custodios_recruitment_access" 
ON public.candidatos_custodios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas')
  )
);

-- Fix conflicting update policies
DROP POLICY IF EXISTS "candidatos_custodios_update_recruitment" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_supply_admin_update" ON public.candidatos_custodios;

CREATE POLICY "candidatos_custodios_update_authorized" 
ON public.candidatos_custodios 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
  )
);

-- PHASE 3: Create audit logging function for sensitive access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  operation text,
  record_id text DEFAULT null,
  additional_data jsonb DEFAULT null
) RETURNS void
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
    gen_random_uuid(), -- placeholder since this is general audit
    'Sensitive data access audit',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'additional_data', additional_data,
      'timestamp', now(),
      'user_id', auth.uid()
    ),
    inet_client_addr()
  );
END;
$$;

-- PHASE 4: Fix function search paths for security
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS text
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