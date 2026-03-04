
-- 1. Backfill custodio_id for tickets with phone but no custodio_id
UPDATE tickets t
SET custodio_id = co.id
FROM custodios_operativos co
WHERE t.tipo_ticket = 'custodio'
  AND t.custodio_id IS NULL
  AND t.custodio_telefono IS NOT NULL
  AND (
    co.telefono = REGEXP_REPLACE(t.custodio_telefono, '[^0-9]', '', 'g')
    OR co.telefono = RIGHT(REGEXP_REPLACE(t.custodio_telefono, '[^0-9]', '', 'g'), 10)
    OR RIGHT(co.telefono, 10) = RIGHT(REGEXP_REPLACE(t.custodio_telefono, '[^0-9]', '', 'g'), 10)
  );

-- 2. Assign all unassigned custodio tickets to Daniela Castañeda
UPDATE tickets
SET assigned_to = 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca'
WHERE tipo_ticket = 'custodio'
  AND assigned_to IS NULL;

-- 3. Grant ticket page permissions to coordinador_operaciones
INSERT INTO role_permissions (role, permission_type, permission_id, allowed)
VALUES 
  ('coordinador_operaciones', 'page', 'tickets', true),
  ('coordinador_operaciones', 'page', 'ticket-detail', true),
  ('coordinador_operaciones', 'module', 'tickets', true)
ON CONFLICT (role, permission_type, permission_id) DO NOTHING;
