-- 1. Create reusable validation function
CREATE OR REPLACE FUNCTION public.validate_candidato_id_dual()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.candidatos_custodios WHERE id = NEW.candidato_id)
     AND NOT EXISTS (SELECT 1 FROM public.candidatos_armados WHERE id = NEW.candidato_id) THEN
    RAISE EXCEPTION 'candidato_id % no existe en candidatos_custodios ni candidatos_armados', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. evaluaciones_toxicologicas
ALTER TABLE public.evaluaciones_toxicologicas
  DROP CONSTRAINT IF EXISTS evaluaciones_toxicologicas_candidato_id_fkey;

CREATE TRIGGER trg_validate_candidato_evaluaciones_toxicologicas
  BEFORE INSERT OR UPDATE ON public.evaluaciones_toxicologicas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_id_dual();

-- 3. entrevistas_estructuradas
ALTER TABLE public.entrevistas_estructuradas
  DROP CONSTRAINT IF EXISTS entrevistas_estructuradas_candidato_id_fkey;

CREATE TRIGGER trg_validate_candidato_entrevistas_estructuradas
  BEFORE INSERT OR UPDATE ON public.entrevistas_estructuradas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_id_dual();

-- 4. candidato_risk_checklist
ALTER TABLE public.candidato_risk_checklist
  DROP CONSTRAINT IF EXISTS candidato_risk_checklist_candidato_id_fkey;

CREATE TRIGGER trg_validate_candidato_risk_checklist
  BEFORE INSERT OR UPDATE ON public.candidato_risk_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_id_dual();

-- 5. referencias_candidato
ALTER TABLE public.referencias_candidato
  DROP CONSTRAINT IF EXISTS referencias_candidato_candidato_id_fkey;

CREATE TRIGGER trg_validate_candidato_referencias
  BEFORE INSERT OR UPDATE ON public.referencias_candidato
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_id_dual();

-- 6. contratos_candidato
ALTER TABLE public.contratos_candidato
  DROP CONSTRAINT IF EXISTS contratos_candidato_candidato_id_fkey;

CREATE TRIGGER trg_validate_candidato_contratos
  BEFORE INSERT OR UPDATE ON public.contratos_candidato
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_id_dual();