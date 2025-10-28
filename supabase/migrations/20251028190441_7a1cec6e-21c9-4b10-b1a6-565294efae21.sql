-- ============================================
-- CLEANUP: Remove duplicate RLS policies on matriz_precios_rutas
-- ============================================

-- Drop old/duplicate INSERT policy
DROP POLICY IF EXISTS "matriz_precios_rutas_insert_authorized" ON matriz_precios_rutas;

-- Rename the secure one for clarity (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'matriz_precios_rutas' 
    AND policyname = 'matriz_precios_insert_authorized_secure'
  ) THEN
    ALTER POLICY "matriz_precios_insert_authorized_secure" 
    ON matriz_precios_rutas 
    RENAME TO "matriz_precios_insert_authorized";
    
    RAISE NOTICE 'Renamed policy matriz_precios_insert_authorized_secure to matriz_precios_insert_authorized';
  END IF;
END $$;

-- Verify final state
DO $$
DECLARE
  insert_policy_count INT;
  policy_names TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(policyname, ', ') 
  INTO insert_policy_count, policy_names
  FROM pg_policies
  WHERE tablename = 'matriz_precios_rutas'
    AND cmd = 'INSERT';
  
  IF insert_policy_count = 0 THEN
    RAISE EXCEPTION 'No INSERT policies found on matriz_precios_rutas after cleanup';
  ELSIF insert_policy_count > 1 THEN
    RAISE EXCEPTION 'Expected 1 INSERT policy on matriz_precios_rutas, found %: %', insert_policy_count, policy_names;
  END IF;
  
  RAISE NOTICE 'Successfully cleaned up matriz_precios_rutas policies. Now has 1 INSERT policy: %', policy_names;
END $$;

COMMENT ON POLICY "matriz_precios_insert_authorized" ON matriz_precios_rutas 
IS 'Allows authorized roles (admin, owner, supply_admin, coordinador_operaciones, planificador) to create routes';