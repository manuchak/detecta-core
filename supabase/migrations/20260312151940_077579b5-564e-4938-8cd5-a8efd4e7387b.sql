-- Drop rigid FK to candidatos_custodios on estudios_socioeconomicos
ALTER TABLE estudios_socioeconomicos DROP CONSTRAINT IF EXISTS estudios_socioeconomicos_candidato_id_fkey;

-- Create trigger function to validate candidato_id in both tables
CREATE OR REPLACE FUNCTION validate_estudio_candidato_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_id
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_id
  ) THEN
    RAISE EXCEPTION 'candidato_id % not found in candidatos_custodios or candidatos_armados', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_validate_estudio_candidato ON estudios_socioeconomicos;
CREATE TRIGGER trg_validate_estudio_candidato
  BEFORE INSERT OR UPDATE ON estudios_socioeconomicos
  FOR EACH ROW EXECUTE FUNCTION validate_estudio_candidato_id();