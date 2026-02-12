
-- Parte 1: Backfill - Actualizar emails existentes
UPDATE custodios_operativos co
SET email = cc.email, updated_at = NOW()
FROM candidatos_custodios cc
WHERE cc.telefono = co.telefono
  AND co.email IS NULL
  AND cc.email IS NOT NULL;

-- Parte 2: Trigger de sincronizacion continua
CREATE OR REPLACE FUNCTION sync_candidato_email_to_operativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND (OLD.email IS NULL OR NEW.email != OLD.email) THEN
    UPDATE custodios_operativos
    SET email = NEW.email, updated_at = NOW()
    WHERE telefono = NEW.telefono
      AND (email IS NULL OR email != NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_email_candidato_to_operativo
AFTER UPDATE OF email ON candidatos_custodios
FOR EACH ROW
EXECUTE FUNCTION sync_candidato_email_to_operativo();
