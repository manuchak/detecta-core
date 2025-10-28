-- ============================================
-- SECURITY: Remove overly permissive RLS policies
-- ============================================
-- This migration removes 6 policies that use USING(true) or WITH CHECK(true)
-- which bypass security checks. The existing role-based policies are sufficient.

-- 1. DROP overly permissive SELECT policy on metricas_demanda_zona
DROP POLICY IF EXISTS "metricas_demanda_zona_select_authorized" ON metricas_demanda_zona;

-- 2. DROP overly permissive SELECT policy on presupuestos_zona
DROP POLICY IF EXISTS "presupuestos_zona_select_authorized" ON presupuestos_zona;

-- 3. DROP overly permissive SELECT policy on roi_custodios
DROP POLICY IF EXISTS "roi_custodios_select_authorized" ON roi_custodios;

-- 4. DROP overly permissive INSERT policy on configuracion_reportes
DROP POLICY IF EXISTS "configuracion_reportes_insert_authorized" ON configuracion_reportes;

-- 5. DROP overly permissive INSERT policy on configuracion_sensores
DROP POLICY IF EXISTS "configuracion_sensores_insert_authorized" ON configuracion_sensores;

-- 6. DROP overly permissive INSERT policy on security_audit_log
DROP POLICY IF EXISTS "security_audit_log_insert_authorized" ON security_audit_log;

-- Verification: Log the cleanup results
DO $$
DECLARE
  permissive_policies_count INT;
BEGIN
  -- Count any remaining policies with USING(true) or WITH CHECK(true)
  SELECT COUNT(*) INTO permissive_policies_count
  FROM pg_policies
  WHERE (qual::text = 'true' OR with_check::text = 'true')
    AND tablename IN (
      'metricas_demanda_zona', 
      'presupuestos_zona', 
      'roi_custodios',
      'configuracion_reportes',
      'configuracion_sensores',
      'security_audit_log'
    );
  
  IF permissive_policies_count > 0 THEN
    RAISE WARNING 'Found % overly permissive policies remaining on target tables', permissive_policies_count;
  ELSE
    RAISE NOTICE '✅ Successfully removed all overly permissive policies. Role-based policies remain in effect.';
  END IF;
END $$;

-- Add comments documenting the change
COMMENT ON TABLE metricas_demanda_zona IS 'Demand metrics by zone - protected by role-based RLS policies only';
COMMENT ON TABLE presupuestos_zona IS 'Zone budgets - protected by role-based RLS policies only';
COMMENT ON TABLE roi_custodios IS 'Custodian ROI data - protected by role-based RLS policies only';
COMMENT ON TABLE configuracion_reportes IS 'Report configurations - protected by role-based RLS policies only';
COMMENT ON TABLE configuracion_sensores IS 'Sensor configurations - protected by role-based RLS policies only';
COMMENT ON TABLE security_audit_log IS 'Security audit logs - protected by role-based RLS policies only';