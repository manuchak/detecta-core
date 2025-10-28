-- ============================================
-- SECURITY FIX: Remove remaining permissive RLS policies (CORRECTED)
-- ============================================
-- Previous migration used incorrect policy names. This uses the actual names from pg_policies.

-- 1. DROP overly permissive SELECT policy on metricas_demanda_zona
DROP POLICY IF EXISTS "metricas_demanda_all_read" ON metricas_demanda_zona;

-- 2. DROP overly permissive SELECT policy on presupuestos_zona
DROP POLICY IF EXISTS "Allow read presupuestos_zona" ON presupuestos_zona;

-- 3. DROP overly permissive SELECT policy on roi_custodios
DROP POLICY IF EXISTS "Allow read roi_custodios" ON roi_custodios;

-- 4. DROP overly permissive INSERT policy on configuracion_reportes
DROP POLICY IF EXISTS "Allow authenticated insert configuracion_reportes" ON configuracion_reportes;

-- 5. DROP overly permissive INSERT policy on configuracion_sensores
DROP POLICY IF EXISTS "Allow authenticated insert configuracion_sensores" ON configuracion_sensores;

-- 6. DROP overly permissive INSERT policy on security_audit_log
DROP POLICY IF EXISTS "audit_log_system_insert" ON security_audit_log;

-- Verification query to confirm cleanup
DO $$
DECLARE
  remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual::text = 'true' OR with_check::text = 'true')
    AND tablename IN (
      'metricas_demanda_zona',
      'presupuestos_zona', 
      'roi_custodios',
      'configuracion_reportes',
      'configuracion_sensores',
      'security_audit_log'
    );
  
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ Successfully removed all 6 overly permissive policies';
  ELSE
    RAISE WARNING '⚠️ Still found % permissive policies on operational tables', remaining_count;
  END IF;
END $$;