-- Phase 2: Secure Business Intelligence Tables (Fixed)

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

-- Log successful completion of Phase 2 (directly to audit table)
INSERT INTO public.audit_log_productos (
  usuario_id,
  accion,
  producto_id,
  motivo,
  datos_nuevos
) VALUES (
  COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
  'PHASE_2_SECURITY_FIXES_COMPLETE',
  gen_random_uuid(),
  'Business intelligence data secured with role-based access',
  jsonb_build_object(
    'phase', 2,
    'status', 'SUCCESS',
    'fixes_applied', ARRAY[
      'Business intelligence tables secured with role-based access',
      'Public read access removed from sensitive tables'
    ],
    'tables_secured', ARRAY[
      'servicios_segmentados',
      'zonas_operacion_nacional', 
      'ml_model_configurations'
    ],
    'timestamp', now()
  )
);