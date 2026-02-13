
DROP POLICY IF EXISTS "Custodios gestionan checklist propio" ON checklist_servicio;

CREATE POLICY "Custodios gestionan checklist propio"
ON checklist_servicio FOR ALL
USING (
  custodio_telefono = replace(replace(
    (SELECT phone FROM profiles WHERE id = auth.uid()),
    ' ', ''), '-', '')
);
