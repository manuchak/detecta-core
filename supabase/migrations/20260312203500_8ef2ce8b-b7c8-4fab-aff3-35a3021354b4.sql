-- Fix: Allow reactivation from pool (aprobado_en_espera → aprobado) without candidato requirement
CREATE OR REPLACE FUNCTION check_lead_approval_has_candidato()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'aprobado' AND OLD.estado IS DISTINCT FROM 'aprobado' THEN
    -- Permitir reactivación desde pool sin exigir candidato
    IF OLD.estado = 'aprobado_en_espera' THEN
      RETURN NEW;
    END IF;
    -- Para nuevas aprobaciones, exigir vínculo con candidato
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