
-- Hacer firma obligatoria en checklists completos
-- Usamos un trigger de validación en lugar de CHECK constraint para mayor flexibilidad

CREATE OR REPLACE FUNCTION public.validate_checklist_firma()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completo' AND (NEW.firma_base64 IS NULL OR NEW.firma_base64 = '') THEN
    RAISE EXCEPTION 'La firma digital es obligatoria para checklists con estado completo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_checklist_firma
BEFORE INSERT OR UPDATE ON public.checklist_servicio
FOR EACH ROW
EXECUTE FUNCTION public.validate_checklist_firma();
