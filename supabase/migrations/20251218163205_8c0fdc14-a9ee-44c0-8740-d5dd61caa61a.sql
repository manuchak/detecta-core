-- Fix servicios_custodia_public_exposure: Remove phone-based access policies
-- These allow any user with a matching phone to see sensitive operational data

-- Drop problematic phone-based policies
DROP POLICY IF EXISTS "Servicios custodia acceso controlado" ON servicios_custodia;
DROP POLICY IF EXISTS "servicios_custodia_select_self" ON servicios_custodia;
DROP POLICY IF EXISTS "Servicios custodia para roles operativos" ON servicios_custodia;

-- Create secure custodian self-access policy
-- Only users with 'custodio' role can see services where they are assigned
CREATE POLICY "servicios_custodia_select_custodio_own" ON servicios_custodia
FOR SELECT TO authenticated
USING (
  -- Custodios can only see their own assigned services
  (
    user_has_role_direct('custodio') 
    AND id_custodio IS NOT NULL 
    AND id_custodio = auth.uid()::text
  )
);

-- The existing servicios_custodia_select_admin_ops policy already covers operational roles:
-- owner, admin, manager, supply_admin, supply_lead, coordinador_operaciones, 
-- jefe_seguridad, analista_seguridad, monitoring_supervisor, monitoring, bi

-- Summary of remaining SELECT policies:
-- 1. servicios_custodia_select_admin_ops: Operational roles see all (✓ secure)
-- 2. servicios_custodia_select_custodio_own: Custodios see only their assigned services (✓ secure)
-- 
-- Removed:
-- - Phone-based matching (security risk)
-- - Duplicate/redundant policies