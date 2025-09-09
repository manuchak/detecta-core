-- Fix para el problema de manual_call_logs
-- Crear trigger que establezca automáticamente created_by = auth.uid() en inserts

CREATE OR REPLACE FUNCTION public.set_created_by_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo establecer created_by si no se ha proporcionado
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear el trigger
CREATE TRIGGER manual_call_logs_set_created_by
  BEFORE INSERT ON public.manual_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_trigger();

-- También agregar valor por defecto al campo por seguridad adicional
ALTER TABLE public.manual_call_logs 
ALTER COLUMN created_by SET DEFAULT auth.uid();