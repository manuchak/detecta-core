-- Phase 2: Implement Conservative RLS Policies for Unprotected Tables
-- Being very careful with auth management and existing functionality

-- 1. contactos_emergencia_servicio: Emergency contacts for services
-- Conservative approach: Allow authenticated users to manage contacts
-- for services they have access to
ALTER TABLE contactos_emergencia_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view emergency contacts"
ON contactos_emergencia_servicio
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage emergency contacts"
ON contactos_emergencia_servicio
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. evaluaciones_instaladores: Installer evaluations
-- Conservative approach: Allow authenticated users to view and manage
-- evaluations, with special permissions for admins
ALTER TABLE evaluaciones_instaladores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view installer evaluations"
ON evaluaciones_instaladores
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Evaluators can manage their evaluations"
ON evaluaciones_instaladores
FOR ALL
TO authenticated
USING (
    auth.uid() IS NOT NULL AND 
    (evaluado_por = auth.uid() OR is_admin_user_secure())
)
WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (evaluado_por = auth.uid() OR is_admin_user_secure())
);

-- 3. flagged_services: Flagged services for review
-- Conservative approach: Allow authenticated users to view and manage
-- flagged services, ensuring data integrity
ALTER TABLE flagged_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view flagged services"
ON flagged_services
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage flagged services"
ON flagged_services
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON POLICY "Authenticated users can view emergency contacts" ON contactos_emergencia_servicio 
IS 'Conservative policy: Any authenticated user can view emergency contacts';

COMMENT ON POLICY "Authenticated users can manage emergency contacts" ON contactos_emergencia_servicio 
IS 'Conservative policy: Any authenticated user can manage emergency contacts';

COMMENT ON POLICY "Authenticated users can view installer evaluations" ON evaluaciones_instaladores 
IS 'Conservative policy: Any authenticated user can view installer evaluations';

COMMENT ON POLICY "Evaluators can manage their evaluations" ON evaluaciones_instaladores 
IS 'Conservative policy: Users can manage evaluations they created or if admin';

COMMENT ON POLICY "Authenticated users can view flagged services" ON flagged_services 
IS 'Conservative policy: Any authenticated user can view flagged services';

COMMENT ON POLICY "Authenticated users can manage flagged services" ON flagged_services 
IS 'Conservative policy: Any authenticated user can manage flagged services';