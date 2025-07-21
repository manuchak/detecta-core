-- Arreglar la función del trigger para evitar problemas de permisos
CREATE OR REPLACE FUNCTION public.update_ml_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Comentamos updated_by para evitar problemas de permisos en el trigger
  -- NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;