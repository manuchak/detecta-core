-- Fix servicios_custodia ID generation - Corrected version

-- Step 1: First, let's see what we're working with
-- Count records without ID
-- SELECT COUNT(*) as records_without_id FROM servicios_custodia WHERE id IS NULL;

-- Step 2: Assign temporary sequential IDs to NULL records starting from a safe high number
WITH null_records AS (
  SELECT ctid, 
         ROW_NUMBER() OVER (ORDER BY created_at, id_servicio) + 1000000 as new_id
  FROM servicios_custodia 
  WHERE id IS NULL
)
UPDATE servicios_custodia 
SET id = null_records.new_id
FROM null_records
WHERE servicios_custodia.ctid = null_records.ctid;

-- Step 3: Find the current maximum ID
-- We'll use this to set our sequence start point
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM servicios_custodia;
    
    -- Create a sequence for auto-incrementing IDs
    CREATE SEQUENCE IF NOT EXISTS servicios_custodia_id_seq;
    
    -- Set the sequence to start after the maximum existing ID
    PERFORM setval('servicios_custodia_id_seq', max_id + 1, false);
    
    -- Make the ID column NOT NULL and set default to use sequence
    ALTER TABLE servicios_custodia ALTER COLUMN id SET NOT NULL;
    ALTER TABLE servicios_custodia ALTER COLUMN id SET DEFAULT nextval('servicios_custodia_id_seq');
    
    -- Associate the sequence with the column for proper cleanup
    ALTER SEQUENCE servicios_custodia_id_seq OWNED BY servicios_custodia.id;
END $$;

-- Add helpful comment
COMMENT ON COLUMN servicios_custodia.id IS 'Auto-incremental primary key, generated automatically for new records';