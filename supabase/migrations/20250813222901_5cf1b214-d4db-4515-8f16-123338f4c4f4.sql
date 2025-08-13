-- CRITICAL SECURITY FIXES

-- 1. Remove hardcoded admin bypasses and secure sensitive tables
-- First, let's secure the sensitive business intelligence tables

-- Add RLS to zonas_operacion_nacional if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'zonas_operacion_nacional' 
        AND policyname = 'zonas_operacion_restricted_access'
    ) THEN
        ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "zonas_operacion_restricted_access" 
        ON public.zonas_operacion_nacional 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner', 'bi', 'coordinador_operaciones')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner', 'bi')
            )
        );
    END IF;
END $$;

-- Secure servicios_segmentados table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servicios_segmentados' 
        AND policyname = 'servicios_segmentados_restricted_access'
    ) THEN
        ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "servicios_segmentados_restricted_access" 
        ON public.servicios_segmentados 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner', 'bi', 'coordinador_operaciones')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner', 'bi')
            )
        );
    END IF;
END $$;

-- Secure ml_model_configurations table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ml_model_configurations' 
        AND policyname = 'ml_model_configurations_admin_only'
    ) THEN
        ALTER TABLE public.ml_model_configurations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "ml_model_configurations_admin_only" 
        ON public.ml_model_configurations 
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role IN ('admin', 'owner')
            )
        );
    END IF;
END $$;

-- 2. Fix existing security functions by removing hardcoded bypasses and adding proper security

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

-- Update get_user_roles_safe function
CREATE OR REPLACE FUNCTION public.get_user_roles_safe()
RETURNS TABLE(role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role 
  FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid()
  ORDER BY
    CASE ur.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'bi' THEN 4
      WHEN 'monitoring_supervisor' THEN 5
      WHEN 'monitoring' THEN 6
      WHEN 'supply' THEN 7
      WHEN 'soporte' THEN 8
      WHEN 'pending' THEN 9
      WHEN 'unverified' THEN 10
      ELSE 11
    END;
END;
$$;

-- Update can_access_recruitment_data function
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

-- Create secure role checking function
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = required_role
  );
END;
$$;

-- Update can_manage_wms function with proper security
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

-- Create audit logging function for sensitive access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name text,
  operation text,
  record_id text DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log sensitive data access for security auditing
  INSERT INTO public.audit_log_productos (
    usuario_id,
    accion,
    producto_id,
    motivo,
    datos_nuevos
  ) VALUES (
    auth.uid(),
    operation || ' on ' || table_name,
    COALESCE(record_id::uuid, gen_random_uuid()),
    'Security audit log',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'record_id', record_id,
      'additional_data', additional_data,
      'timestamp', now(),
      'user_id', auth.uid(),
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
END;
$$;

-- 3. Add missing SET search_path TO 'public' to existing functions that need it
-- Update functions that are missing proper search_path settings

-- Fix verificar_cumplimiento_referido
CREATE OR REPLACE FUNCTION public.verificar_cumplimiento_referido(p_referido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  servicios_completados INTEGER;
  fecha_activacion TIMESTAMP WITH TIME ZONE;
  dias_permanencia INTEGER;
  config_record RECORD;
BEGIN
  -- Obtener configuración activa
  SELECT * INTO config_record 
  FROM configuracion_bonos_referidos 
  WHERE activo = true 
  LIMIT 1;
  
  IF config_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar servicios completados
  SELECT COUNT(*) INTO servicios_completados
  FROM servicios_custodia
  WHERE id_custodio = p_referido_id::text
    AND estado IN ('completado', 'Completado', 'finalizado', 'Finalizado');
  
  -- Verificar días de permanencia
  SELECT created_at INTO fecha_activacion
  FROM profiles
  WHERE id = p_referido_id;
  
  dias_permanencia := EXTRACT(DAY FROM now() - fecha_activacion);
  
  RETURN servicios_completados >= config_record.servicios_minimos_requeridos 
    AND dias_permanencia >= config_record.dias_minimos_permanencia;
END;
$$;

-- Update role permission functions with proper security
CREATE OR REPLACE FUNCTION public.get_available_roles_secure()
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return roles if user is authorized
  IF NOT (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin')
    )
  ) THEN
    RETURN ARRAY[]::text[];
  END IF;
  
  RETURN ARRAY[
    'owner',
    'admin', 
    'supply_admin',
    'bi',
    'monitoring_supervisor',
    'monitoring',
    'coordinador_operaciones',
    'supply',
    'custodio',
    'ejecutivo_ventas',
    'soporte',
    'pending',
    'unverified'
  ];
END;
$$;