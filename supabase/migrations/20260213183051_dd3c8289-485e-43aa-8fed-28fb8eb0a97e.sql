
DROP POLICY IF EXISTS "Staff ve todos los checklists" ON checklist_servicio;

CREATE POLICY "Staff ve todos los checklists"
  ON checklist_servicio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY[
        'admin',
        'owner',
        'monitoring',
        'planificador',
        'coordinador_operaciones',
        'ejecutivo_ventas'
      ])
    )
  );
