
-- Backfill custodio_id for existing tickets using normalized phone matching
UPDATE tickets t
SET custodio_id = matched.custodio_id
FROM (
  SELECT DISTINCT ON (t2.id) t2.id as ticket_id, co.id as custodio_id
  FROM tickets t2
  JOIN custodios_operativos co 
    ON replace(replace(replace(t2.custodio_telefono, ' ', ''), '-', ''), '+52', '') 
     = replace(replace(replace(co.telefono, ' ', ''), '-', ''), '+52', '')
  WHERE t2.custodio_id IS NULL
    AND t2.custodio_telefono IS NOT NULL
  ORDER BY t2.id, co.created_at DESC
) matched
WHERE t.id = matched.ticket_id;
