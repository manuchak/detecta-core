-- PHASE 1: CRITICAL SECURITY FIXES (CORRECTED)
-- First, let's check what policies exist and create only what's needed

-- Fix servicios_segmentados if no restrictive policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'servicios_segmentados' 
        AND policyname = 'servicios_segmentados_restricted_access'
    ) THEN
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
        );
    END IF;
END $$;

-- Fix zonas_operacion_nacional
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'zonas_operacion_nacional' 
        AND policyname = 'zonas_operacion_nacional_restricted_access'
    ) THEN
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
        );
    END IF;
END $$;

-- Fix ml_model_configurations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ml_model_configurations' 
        AND policyname = 'ml_model_configurations_restricted_access'
    ) THEN
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
        );
    END IF;
END $$;

-- Fix rewards table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rewards' 
        AND policyname = 'rewards_authenticated_access'
    ) THEN
        DROP POLICY IF EXISTS "rewards_public_read" ON public.rewards;
        CREATE POLICY "rewards_authenticated_access" 
        ON public.rewards 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rewards' 
        AND policyname = 'rewards_admin_manage'
    ) THEN
        CREATE POLICY "rewards_admin_manage" 
        ON public.rewards 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'manager')
          )
        );
    END IF;
END $$;

-- Fix marcas_vehiculos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marcas_vehiculos' 
        AND policyname = 'marcas_vehiculos_authenticated_access'
    ) THEN
        DROP POLICY IF EXISTS "marcas_vehiculos_public_read" ON public.marcas_vehiculos;
        CREATE POLICY "marcas_vehiculos_authenticated_access" 
        ON public.marcas_vehiculos 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marcas_vehiculos' 
        AND policyname = 'marcas_vehiculos_admin_manage'
    ) THEN
        CREATE POLICY "marcas_vehiculos_admin_manage" 
        ON public.marcas_vehiculos 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones')
          )
        );
    END IF;
END $$;

-- Fix modelos_vehiculos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modelos_vehiculos' 
        AND policyname = 'modelos_vehiculos_authenticated_access'
    ) THEN
        DROP POLICY IF EXISTS "modelos_vehiculos_public_read" ON public.modelos_vehiculos;
        CREATE POLICY "modelos_vehiculos_authenticated_access" 
        ON public.modelos_vehiculos 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'modelos_vehiculos' 
        AND policyname = 'modelos_vehiculos_admin_manage'
    ) THEN
        CREATE POLICY "modelos_vehiculos_admin_manage" 
        ON public.modelos_vehiculos 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones')
          )
        );
    END IF;
END $$;