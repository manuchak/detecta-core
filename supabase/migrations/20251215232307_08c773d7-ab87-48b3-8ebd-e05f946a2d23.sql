-- Add pc_custodio_id column to custodios_operativos for sync with pc_custodios
ALTER TABLE custodios_operativos 
ADD COLUMN IF NOT EXISTS pc_custodio_id UUID REFERENCES pc_custodios(id);

-- Create unique partial index for ON CONFLICT clause (only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_custodios_operativos_pc_custodio_id 
ON custodios_operativos(pc_custodio_id) 
WHERE pc_custodio_id IS NOT NULL;

-- Create lookup index for performance
CREATE INDEX IF NOT EXISTS idx_custodios_operativos_pc_custodio_id_lookup 
ON custodios_operativos(pc_custodio_id);

-- Add comment for documentation
COMMENT ON COLUMN custodios_operativos.pc_custodio_id IS 'Foreign key to pc_custodios for traceability during liberation sync';