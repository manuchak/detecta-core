-- Phase 2: Secure Business Intelligence Tables - Remove public access and implement proper RLS

-- Secure servicios_segmentados table
DROP POLICY IF EXISTS "servicios_segmentados_read_authenticated" ON public.servicios_segmentados;
CREATE POLICY "BI data restricted access - servicios_segmentados" 
ON public.servicios_segmentados
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

-- Secure zonas_operacion_nacional table  
DROP POLICY IF EXISTS "zonas_operacion_nacional_read_authenticated" ON public.zonas_operacion_nacional;
CREATE POLICY "BI data restricted access - zonas_operacion" 
ON public.zonas_operacion_nacional
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin', 'coordinador_operaciones')
  )
);

-- Secure ml_model_configurations table
DROP POLICY IF EXISTS "ml_model_configurations_read_authenticated" ON public.ml_model_configurations;
CREATE POLICY "BI data restricted access - ml_models" 
ON public.ml_model_configurations
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- Add comprehensive audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  table_name TEXT,
  operation TEXT,
  record_id UUID DEFAULT NULL,
  additional_data JSONB DEFAULT NULL
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
    datos_nuevos
  ) VALUES (
    auth.uid(),
    operation || ' on ' || table_name,
    COALESCE(record_id, gen_random_uuid()),
    'Sensitive data access audit trail',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'user_role', public.get_current_user_role_secure(),
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'additional_data', additional_data
    )
  );
END;
$$;

-- Log successful completion of Phase 2
SELECT public.log_sensitive_access(
  'security_audit',
  'PHASE_2_SECURITY_FIXES_COMPLETE',
  gen_random_uuid(),
  jsonb_build_object(
    'phase', 2,
    'status', 'SUCCESS',
    'fixes_applied', ARRAY[
      'Business intelligence tables secured with role-based access',
      'Audit logging function enhanced',
      'Public read access removed from sensitive tables'
    ],
    'tables_secured', ARRAY[
      'servicios_segmentados',
      'zonas_operacion_nacional', 
      'ml_model_configurations'
    ]
  )
);