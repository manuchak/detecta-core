-- Critical Security Fix: Add Row Level Security policies for exposed sensitive tables (corrected)

-- 1. Secure servicios_segmentados table (Business Intelligence data)
ALTER TABLE public.servicios_segmentados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicios_segmentados_bi_access" 
ON public.servicios_segmentados 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'bi', 'supply_admin')
  )
);

-- 2. Secure zonas_operacion_nacional table (Operational zones)  
ALTER TABLE public.zonas_operacion_nacional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zonas_operacion_operational_access"
ON public.zonas_operacion_nacional
FOR ALL  
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'ejecutivo_ventas')
  )
);

-- 3. Secure ml_model_configurations table (AI/ML configurations)
ALTER TABLE public.ml_model_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ml_model_configurations_admin_access"
ON public.ml_model_configurations
FOR ALL
TO authenticated  
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'bi')
  )
);

-- 4. Secure subcategorias_gastos table (Financial categories)
ALTER TABLE public.subcategorias_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcategorias_gastos_financial_access"
ON public.subcategorias_gastos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles  
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'bi')
  )
);

-- 5. Secure system_limits table (Operational constraints)
ALTER TABLE public.system_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_limits_authenticated_read"
ON public.system_limits
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "system_limits_admin_manage"  
ON public.system_limits
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- 6. Fix configuracion_bonos_referidos access (currently too permissive)
DROP POLICY IF EXISTS "Todos pueden ver configuración de bonos" ON public.configuracion_bonos_referidos;

CREATE POLICY "configuracion_bonos_financial_access"
ON public.configuracion_bonos_referidos  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'custodio')
  )
);

-- 7. Secure rewards table - check if policies exist first
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist and recreate with proper names
  DROP POLICY IF EXISTS "rewards_authenticated_read" ON public.rewards;
  DROP POLICY IF EXISTS "rewards_admin_manage" ON public.rewards;
  
  CREATE POLICY "rewards_authenticated_read_new"
  ON public.rewards
  FOR SELECT 
  TO authenticated
  USING (true);

  CREATE POLICY "rewards_admin_manage_new"
  ON public.rewards  
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'supply_admin')
    )
  );
END $$;

-- 8. Secure categorias_principales (business classification)
DROP POLICY IF EXISTS "Todos pueden ver categorías principales" ON public.categorias_principales;

CREATE POLICY "categorias_principales_authenticated_access"
ON public.categorias_principales
FOR SELECT
TO authenticated  
USING (activo = true);

CREATE POLICY "categorias_principales_admin_manage"
ON public.categorias_principales
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);