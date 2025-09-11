-- Fix servicios_custodia ID generation and data integrity

-- First, let's set a temporary default for existing NULL IDs
-- We'll use negative values to avoid conflicts with future auto-generated IDs
UPDATE servicios_custodia 
SET id = (SELECT COALESCE(MIN(id), 0) - row_number() OVER (ORDER BY created_at, id_servicio) 
          FROM servicios_custodia s2 WHERE s2.id IS NOT NULL)
WHERE id IS NULL;

-- Find the maximum existing positive ID to set the sequence start point
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM servicios_custodia WHERE id > 0;
    
    -- Drop the existing id column and recreate it as SERIAL with proper sequence
    ALTER TABLE servicios_custodia ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE servicios_custodia ALTER COLUMN id SET NOT NULL;
    
    -- Create a sequence for the id column
    CREATE SEQUENCE IF NOT EXISTS servicios_custodia_id_seq;
    
    -- Set the sequence to start after the maximum existing ID
    PERFORM setval('servicios_custodia_id_seq', max_id + 1, false);
    
    -- Set the default value for the id column to use the sequence
    ALTER TABLE servicios_custodia ALTER COLUMN id SET DEFAULT nextval('servicios_custodia_id_seq');
    
    -- Associate the sequence with the column
    ALTER SEQUENCE servicios_custodia_id_seq OWNED BY servicios_custodia.id;
END $$;

-- Now fix all the negative IDs (the ones that were NULL) with proper sequential IDs
UPDATE servicios_custodia 
SET id = nextval('servicios_custodia_id_seq')
WHERE id < 0;

-- Add a comment to document the change
COMMENT ON COLUMN servicios_custodia.id IS 'Auto-incremental primary key, generated automatically for new records';