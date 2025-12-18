-- Fix matriz_precios_rutas_sensitive_pricing: Restrict pricing data access to senior management only
-- Remove overly permissive roles (bi, planificador) from accessing sensitive financial data

-- Drop existing SELECT policy that allows too many roles
DROP POLICY IF EXISTS "matriz_precios_select_authorized_roles" ON matriz_precios_rutas;

-- Create stricter SELECT policy - only senior management and finance roles
-- Removed: bi, planificador (these roles don't need access to profit margins and pricing strategy)
CREATE POLICY "matriz_precios_select_senior_management" ON matriz_precios_rutas
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);

-- Also tighten INSERT policy - remove planificador (should only view, not create pricing)
DROP POLICY IF EXISTS "matriz_precios_insert_authorized" ON matriz_precios_rutas;

CREATE POLICY "matriz_precios_insert_senior_management" ON matriz_precios_rutas
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);

-- Tighten UPDATE policy - remove planificador
DROP POLICY IF EXISTS "matriz_precios_rutas_update_authorized" ON matriz_precios_rutas;

CREATE POLICY "matriz_precios_update_senior_management" ON matriz_precios_rutas
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);

-- Clean up duplicate DELETE policies (keep only the stricter one)
DROP POLICY IF EXISTS "Solo admins pueden eliminar matriz de precios" ON matriz_precios_rutas;
-- Keep matriz_precios_rutas_delete_admin which correctly restricts to admin/owner only