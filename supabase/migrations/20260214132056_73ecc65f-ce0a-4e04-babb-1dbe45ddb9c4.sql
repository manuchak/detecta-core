
-- 1. Fix RLS policy: normalize BOTH sides of phone comparison
DROP POLICY IF EXISTS "Custodios gestionan checklist propio" ON checklist_servicio;

CREATE POLICY "Custodios gestionan checklist propio"
ON checklist_servicio FOR ALL
USING (
  regexp_replace(custodio_telefono, '[^0-9]', '', 'g') = 
  regexp_replace(
    (SELECT phone FROM profiles WHERE id = auth.uid()),
    '[^0-9]', '', 'g'
  )
);

-- 2. Normalize existing custodio_telefono data
UPDATE checklist_servicio 
SET custodio_telefono = regexp_replace(custodio_telefono, '[^0-9]', '', 'g')
WHERE custodio_telefono ~ '[^0-9]';
