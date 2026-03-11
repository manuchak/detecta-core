-- Drop ALL remaining FKs to candidatos_custodios that block multi-table references
ALTER TABLE documentos_candidato DROP CONSTRAINT IF EXISTS documentos_candidato_candidato_id_fkey;
ALTER TABLE evaluaciones_psicometricas DROP CONSTRAINT IF EXISTS evaluaciones_psicometricas_candidato_id_fkey;
ALTER TABLE custodio_liberacion DROP CONSTRAINT IF EXISTS custodio_liberacion_candidato_id_fkey;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_candidato_custodio_id_fkey;

-- Unified validation function for candidato_id across both tables
CREATE OR REPLACE FUNCTION public.validate_candidato_id_both_tables()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.candidato_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_id
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_id
  ) THEN
    RAISE EXCEPTION 'candidato_id % not found', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Validation for leads.candidato_custodio_id
CREATE OR REPLACE FUNCTION public.validate_lead_candidato_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.candidato_custodio_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_custodio_id
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_custodio_id
  ) THEN
    RAISE EXCEPTION 'candidato_custodio_id % not found', NEW.candidato_custodio_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_validate_candidato_id ON documentos_candidato;
CREATE TRIGGER trg_validate_candidato_id BEFORE INSERT OR UPDATE ON documentos_candidato FOR EACH ROW EXECUTE FUNCTION validate_candidato_id_both_tables();

DROP TRIGGER IF EXISTS trg_validate_candidato_eval_psico ON evaluaciones_psicometricas;
CREATE TRIGGER trg_validate_candidato_eval_psico BEFORE INSERT OR UPDATE ON evaluaciones_psicometricas FOR EACH ROW EXECUTE FUNCTION validate_candidato_id_both_tables();

DROP TRIGGER IF EXISTS trg_validate_candidato_liberacion ON custodio_liberacion;
CREATE TRIGGER trg_validate_candidato_liberacion BEFORE INSERT OR UPDATE ON custodio_liberacion FOR EACH ROW EXECUTE FUNCTION validate_candidato_id_both_tables();

DROP TRIGGER IF EXISTS trg_validate_lead_candidato ON leads;
CREATE TRIGGER trg_validate_lead_candidato BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION validate_lead_candidato_id();

-- Fix retroactivo Sergio Zuñiga
DO $$
DECLARE
  v_new_armado_id UUID;
  v_old_custodio_id UUID := '30b5922c-2c23-43dd-a832-5ea61827d95c';
  v_lead_id TEXT := 'f1d3fe5e-d3b6-4293-9424-e297f986a079';
BEGIN
  INSERT INTO candidatos_armados (lead_id, nombre, email, telefono, tipo_armado, experiencia_seguridad, estado_proceso, fuente_reclutamiento)
  SELECT v_lead_id, cc.nombre, cc.email, cc.telefono, 'interno', true, cc.estado_proceso, cc.fuente_reclutamiento
  FROM candidatos_custodios cc WHERE cc.id = v_old_custodio_id
  RETURNING id INTO v_new_armado_id;

  IF v_new_armado_id IS NOT NULL THEN
    UPDATE documentos_candidato SET candidato_id = v_new_armado_id WHERE candidato_id = v_old_custodio_id;
    UPDATE evaluaciones_psicometricas SET candidato_id = v_new_armado_id WHERE candidato_id = v_old_custodio_id;
    UPDATE leads SET candidato_custodio_id = v_new_armado_id, updated_at = NOW() WHERE id = v_lead_id;
    UPDATE custodio_liberacion SET candidato_id = v_new_armado_id, tipo_operativo = 'armado' WHERE candidato_id = v_old_custodio_id;
    DELETE FROM candidatos_custodios WHERE id = v_old_custodio_id;
  END IF;
END;
$$;