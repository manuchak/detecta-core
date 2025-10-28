-- ============================================
-- CRITICAL FIX 3/5: Remove conflicting permissive policies
-- ============================================

-- Drop all the overly permissive policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Enable delete for admins only" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver programaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear programaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar programaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar programaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Coordinadores y admins pueden gestionar instalaciones" ON programacion_instalaciones;
DROP POLICY IF EXISTS "Instaladores pueden ver y actualizar sus instalaciones" ON programacion_instalaciones;

-- Keep ONLY the 4 secure policies from migration 20251028181029:
-- 1. instaladores_ven_propias_asignaciones (SELECT)
-- 2. roles_autorizados_crean_instalaciones (INSERT) 
-- 3. actualizar_instalaciones_autorizadas (UPDATE)
-- 4. solo_administracion_elimina_instalaciones (DELETE)

-- Verify final state
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'programacion_instalaciones';
  
  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Expected exactly 4 policies on programacion_instalaciones, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'Successfully cleaned up programacion_instalaciones policies. Now has % secure policies.', policy_count;
END $$;

COMMENT ON TABLE programacion_instalaciones IS 'SECURITY: Access controlled by 4 role-based policies. Installers see only their own assignments.';