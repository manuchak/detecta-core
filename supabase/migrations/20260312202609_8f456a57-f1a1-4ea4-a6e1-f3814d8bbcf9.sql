-- Fix: Corregir trigger que busca columna inexistente 'lead_id' en candidatos_custodios
-- La relación correcta es: leads.candidato_custodio_id -> candidatos_custodios.id
-- Para armados: candidatos_armados SÍ tiene lead_id, así que verificamos ambas rutas

CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    -- Verificar vínculo con candidatos_custodios (via leads.candidato_custodio_id)
    -- O vínculo con candidatos_armados (via candidatos_armados.lead_id)
    IF NEW.candidato_custodio_id IS NULL 
       AND NOT EXISTS (
         SELECT 1 FROM candidatos_armados WHERE lead_id = NEW.id
       ) 
    THEN
      RAISE EXCEPTION 'No se puede aprobar un lead sin crear el registro de candidato. Use el flujo de aprobaciones.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;