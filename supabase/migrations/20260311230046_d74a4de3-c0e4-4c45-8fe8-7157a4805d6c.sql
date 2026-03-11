CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    IF NOT EXISTS (
      SELECT 1 FROM candidatos_custodios 
      WHERE lead_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'No se puede aprobar un lead sin crear el registro de candidato. Use el flujo de aprobaciones.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_lead_approval
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION check_lead_approval_has_candidato();