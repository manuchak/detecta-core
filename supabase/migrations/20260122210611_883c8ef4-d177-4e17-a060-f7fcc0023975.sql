-- Restore profiles visibility for operations managers
-- The policy profiles_lead_managers_view is missing from the database
-- This allows coordinador_operaciones and other supervisory roles to see planner names

CREATE POLICY "profiles_lead_managers_view"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.is_active = true
    AND user_roles.role IN (
      'admin', 
      'owner', 
      'coordinador_operaciones', 
      'planificador', 
      'supply_admin', 
      'supply_lead'
    )
  )
);