-- =====================================================
-- SECURITY HARDENING: Field Operator Role Restrictions
-- =====================================================
-- This migration adds database-level protection to ensure
-- custodios and instaladores cannot access sensitive data
-- even if they bypass frontend route protection.

-- 1. Create helper function to check if user is a field operator
CREATE OR REPLACE FUNCTION public.is_field_operator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('custodio', 'instalador')
    AND is_active = true
  )
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_field_operator() TO authenticated;

COMMENT ON FUNCTION public.is_field_operator() IS 
  'Returns TRUE if the current user is a field operator (custodio or instalador). Used for RLS policies to block sensitive data access.';

-- 2. Add RLS policy to leads table - explicitly block field operators
-- (This is additional protection even though leads already has role-based policies)
DO $$
BEGIN
  -- Drop existing policy if exists (for idempotency)
  DROP POLICY IF EXISTS "leads_block_field_operators" ON public.leads;
  
  -- Create new blocking policy
  CREATE POLICY "leads_block_field_operators"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (NOT public.is_field_operator());
  
  RAISE NOTICE 'Created RLS policy leads_block_field_operators';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: leads table policy update encountered: %', SQLERRM;
END $$;

-- 3. Add RLS policy to servicios_planificados - custodios only see their own services
DO $$
BEGIN
  DROP POLICY IF EXISTS "servicios_planificados_field_operator_restriction" ON public.servicios_planificados;
  
  -- Allow field operators ONLY if they are assigned to the service via phone
  CREATE POLICY "servicios_planificados_field_operator_restriction"
  ON public.servicios_planificados
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_field_operator()
    OR 
    custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
  );
  
  RAISE NOTICE 'Created RLS policy servicios_planificados_field_operator_restriction';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: servicios_planificados policy update encountered: %', SQLERRM;
END $$;

-- 4. Protect pc_clientes (client data) from field operators
DO $$
BEGIN
  DROP POLICY IF EXISTS "pc_clientes_block_field_operators" ON public.pc_clientes;
  
  CREATE POLICY "pc_clientes_block_field_operators"
  ON public.pc_clientes
  FOR SELECT
  TO authenticated
  USING (NOT public.is_field_operator());
  
  RAISE NOTICE 'Created RLS policy pc_clientes_block_field_operators';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: pc_clientes policy update encountered: %', SQLERRM;
END $$;

-- 5. Protect candidatos_custodios (recruitment data) from field operators
DO $$
BEGIN
  DROP POLICY IF EXISTS "candidatos_custodios_block_field_operators" ON public.candidatos_custodios;
  
  CREATE POLICY "candidatos_custodios_block_field_operators"
  ON public.candidatos_custodios
  FOR SELECT
  TO authenticated
  USING (NOT public.is_field_operator());
  
  RAISE NOTICE 'Created RLS policy candidatos_custodios_block_field_operators';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: candidatos_custodios policy update encountered: %', SQLERRM;
END $$;

-- 6. Protect roi_custodios (financial data) from field operators
DO $$
BEGIN
  DROP POLICY IF EXISTS "roi_custodios_block_field_operators" ON public.roi_custodios;
  
  CREATE POLICY "roi_custodios_block_field_operators"
  ON public.roi_custodios
  FOR SELECT
  TO authenticated
  USING (NOT public.is_field_operator());
  
  RAISE NOTICE 'Created RLS policy roi_custodios_block_field_operators';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: roi_custodios policy update encountered: %', SQLERRM;
END $$;

-- 7. Protect matriz_precios_rutas (pricing data) - sensitive financial info
DO $$
BEGIN
  DROP POLICY IF EXISTS "matriz_precios_block_field_operators" ON public.matriz_precios_rutas;
  
  CREATE POLICY "matriz_precios_block_field_operators"
  ON public.matriz_precios_rutas
  FOR SELECT
  TO authenticated
  USING (NOT public.is_field_operator());
  
  RAISE NOTICE 'Created RLS policy matriz_precios_block_field_operators';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: matriz_precios_rutas policy update encountered: %', SQLERRM;
END $$;

-- 8. Ensure checklist_servicio allows custodios to see ONLY their own checklists
DO $$
BEGIN
  DROP POLICY IF EXISTS "checklist_servicio_custodio_own_only" ON public.checklist_servicio;
  
  -- Custodios can only see checklists linked to their phone number
  CREATE POLICY "checklist_servicio_custodio_own_only"
  ON public.checklist_servicio
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_field_operator()
    OR 
    telefono_custodio = (SELECT phone FROM profiles WHERE id = auth.uid())
    OR
    user_id = auth.uid()
  );
  
  RAISE NOTICE 'Created RLS policy checklist_servicio_custodio_own_only';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Note: checklist_servicio policy update encountered: %', SQLERRM;
END $$;

-- 9. Add audit logging for blocked access attempts
CREATE TABLE IF NOT EXISTS public.security_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  attempted_table TEXT NOT NULL,
  attempted_action TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on security log
ALTER TABLE public.security_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "security_log_admin_only"
ON public.security_access_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
    AND is_active = true
  )
);

-- Anyone can insert (for logging blocked attempts)
CREATE POLICY "security_log_insert"
ON public.security_access_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.security_access_log IS 
  'Audit log for security events including blocked access attempts by field operators';

-- Grant necessary permissions
GRANT INSERT ON public.security_access_log TO authenticated;
GRANT SELECT ON public.security_access_log TO authenticated;