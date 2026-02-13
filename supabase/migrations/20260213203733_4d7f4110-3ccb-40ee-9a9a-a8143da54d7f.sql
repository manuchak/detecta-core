
DROP POLICY IF EXISTS "servicios_custodia_select_custodio_own" ON servicios_custodia;

CREATE POLICY "servicios_custodia_select_custodio_own"
ON servicios_custodia FOR SELECT
USING (
  user_has_role_direct('custodio') AND (
    telefono = replace(replace((SELECT phone FROM profiles WHERE id = auth.uid()), ' ', ''), '-', '')
    OR
    telefono_operador = replace(replace((SELECT phone FROM profiles WHERE id = auth.uid()), ' ', ''), '-', '')
  )
);
