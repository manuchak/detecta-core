
-- 1. Drop the rigid FK on contratos_candidato.candidato_id
ALTER TABLE public.contratos_candidato DROP CONSTRAINT IF EXISTS contratos_candidato_candidato_id_fkey;

-- 2. Create dual-table validation trigger
CREATE OR REPLACE FUNCTION public.trg_validate_contrato_candidato_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.candidatos_custodios WHERE id = NEW.candidato_id)
     AND NOT EXISTS (SELECT 1 FROM public.candidatos_armados WHERE id = NEW.candidato_id) THEN
    RAISE EXCEPTION 'candidato_id % not found in candidatos_custodios or candidatos_armados', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_contrato_candidato_id ON public.contratos_candidato;
CREATE TRIGGER trg_check_contrato_candidato_id
  BEFORE INSERT OR UPDATE ON public.contratos_candidato
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_contrato_candidato_id();

-- 3. Update CHECK constraint on contratos_candidato to include prestacion_servicios_armado
ALTER TABLE public.contratos_candidato DROP CONSTRAINT IF EXISTS contratos_candidato_tipo_contrato_check;
ALTER TABLE public.contratos_candidato ADD CONSTRAINT contratos_candidato_tipo_contrato_check 
  CHECK (tipo_contrato IN (
    'confidencialidad', 'prestacion_servicios', 'codigo_conducta', 'aviso_privacidad',
    'responsiva_equipo', 'prestacion_servicios_propietario', 'prestacion_servicios_no_propietario',
    'anexo_gps', 'prestacion_servicios_armado'
  ));

-- 4. Update CHECK constraint on plantillas_contrato to include prestacion_servicios_armado
ALTER TABLE public.plantillas_contrato DROP CONSTRAINT IF EXISTS plantillas_contrato_tipo_contrato_check;
ALTER TABLE public.plantillas_contrato ADD CONSTRAINT plantillas_contrato_tipo_contrato_check 
  CHECK (tipo_contrato IN (
    'confidencialidad', 'prestacion_servicios', 'codigo_conducta', 'aviso_privacidad',
    'responsiva_equipo', 'prestacion_servicios_propietario', 'prestacion_servicios_no_propietario',
    'anexo_gps', 'prestacion_servicios_armado'
  ));
