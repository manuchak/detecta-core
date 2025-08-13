-- PHASE 1: CRITICAL SECURITY FIXES
-- Secure publicly exposed tables with proper RLS policies

-- 1. Secure servicios_segmentados (Business Intelligence data)
DROP POLICY IF EXISTS "servicios_segmentados_public_read" ON public.servicios_segmentados;
CREATE POLICY "servicios_segmentados_restricted_access" 
ON public.servicios_segmentados 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

-- 2. Secure zonas_operacion_nacional (Strategic operational data)
DROP POLICY IF EXISTS "zonas_operacion_nacional_public_read" ON public.zonas_operacion_nacional;
CREATE POLICY "zonas_operacion_nacional_restricted_access" 
ON public.zonas_operacion_nacional 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'monitoring_supervisor', 'monitoring')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
  )
);

-- 3. Secure ml_model_configurations (AI/ML configuration data)
DROP POLICY IF EXISTS "ml_model_configurations_public_read" ON public.ml_model_configurations;
CREATE POLICY "ml_model_configurations_restricted_access" 
ON public.ml_model_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- 4. Secure rewards (User rewards system)
DROP POLICY IF EXISTS "rewards_public_read" ON public.rewards;
CREATE POLICY "rewards_authenticated_access" 
ON public.rewards 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "rewards_admin_manage" 
ON public.rewards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  )
);

-- 5. Secure marcas_vehiculos (Vehicle brand data)
DROP POLICY IF EXISTS "marcas_vehiculos_public_read" ON public.marcas_vehiculos;
CREATE POLICY "marcas_vehiculos_authenticated_access" 
ON public.marcas_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "marcas_vehiculos_admin_manage" 
ON public.marcas_vehiculos 
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

-- 6. Secure modelos_vehiculos (Vehicle model data)
DROP POLICY IF EXISTS "modelos_vehiculos_public_read" ON public.modelos_vehiculos;
CREATE POLICY "modelos_vehiculos_authenticated_access" 
ON public.modelos_vehiculos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "modelos_vehiculos_admin_manage" 
ON public.modelos_vehiculos 
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

-- 7. Create secure function to help with user data access logging
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  operation text,
  user_role text DEFAULT NULL
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
    gen_random_uuid(), -- placeholder since this is general audit
    'Security audit log',
    jsonb_build_object(
      'table', table_name,
      'operation', operation,
      'user_role', COALESCE(user_role, 'unknown'),
      'timestamp', now(),
      'user_id', auth.uid()
    )
  );
END;
$$;

-- 8. Create function to validate user session security
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_id uuid;
  session_valid boolean := false;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND (is_verified = true OR is_verified IS NULL)
  ) INTO session_valid;
  
  RETURN session_valid;
END;
$$;