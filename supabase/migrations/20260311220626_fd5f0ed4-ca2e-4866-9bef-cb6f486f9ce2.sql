
-- 1. Drop the restrictive FK that only points to candidatos_custodios
ALTER TABLE public.evaluaciones_midot
  DROP CONSTRAINT IF EXISTS evaluaciones_midot_candidato_id_fkey;

-- 2. Create a validation trigger function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.validate_candidato_midot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM candidatos_custodios WHERE id = NEW.candidato_id
    UNION ALL
    SELECT 1 FROM candidatos_armados WHERE id = NEW.candidato_id
  ) THEN
    RAISE EXCEPTION 'candidato_id % no existe en candidatos_custodios ni candidatos_armados', NEW.candidato_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach the trigger on INSERT and UPDATE
CREATE TRIGGER trg_validate_candidato_midot
  BEFORE INSERT OR UPDATE ON public.evaluaciones_midot
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_candidato_midot();
