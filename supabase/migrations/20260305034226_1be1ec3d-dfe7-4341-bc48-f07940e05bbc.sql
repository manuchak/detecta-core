-- Backfill customer_name from profiles.display_name via created_by UUID
-- for tickets that have no customer_name and no custodio_id resolved
UPDATE tickets t
SET customer_name = p.display_name
FROM profiles p
WHERE t.created_by::uuid = p.id
  AND t.customer_name IS NULL
  AND p.display_name IS NOT NULL
  AND p.display_name != '';