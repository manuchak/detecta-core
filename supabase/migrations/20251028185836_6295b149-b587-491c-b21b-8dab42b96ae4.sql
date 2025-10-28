-- ============================================
-- CRITICAL FIX 2/5: Restrict armed provider bases to authorized roles
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "bases_proveedores_select_authenticated" ON bases_proveedores_armados;
DROP POLICY IF EXISTS "bases_proveedores_insert_authenticated" ON bases_proveedores_armados;
DROP POLICY IF EXISTS "bases_proveedores_update_authenticated" ON bases_proveedores_armados;
DROP POLICY IF EXISTS "bases_proveedores_delete_authenticated" ON bases_proveedores_armados;

-- Restrict SELECT to authorized operations/security roles
CREATE POLICY "bases_proveedores_restricted_select"
ON bases_proveedores_armados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN (
      'owner', 
      'admin', 
      'coordinador_operaciones', 
      'jefe_seguridad', 
      'supply_admin',
      'planificador'
    )
  )
);

-- Only coordinators and admins can modify
CREATE POLICY "bases_proveedores_admin_manage"
ON bases_proveedores_armados
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordinador_operaciones')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coordinador_operaciones')
  )
);

COMMENT ON TABLE bases_proveedores_armados IS 'SECURITY: Contains physical locations of armed security providers. Restricted to authorized roles only.';