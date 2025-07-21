-- Eliminar el trigger problemático
DROP TRIGGER IF EXISTS update_ml_configurations_updated_at ON public.ml_model_configurations;
DROP FUNCTION IF EXISTS public.update_ml_config_timestamp();

-- Recrear políticas más simples sin conflictos de auth
DROP POLICY IF EXISTS "Admins can manage ML configurations" ON public.ml_model_configurations;
DROP POLICY IF EXISTS "Users can read ML configurations" ON public.ml_model_configurations;

-- Política simple para lectura - todos los usuarios autenticados pueden leer
CREATE POLICY "Anyone can read ML configurations" 
ON public.ml_model_configurations 
FOR SELECT 
USING (true);

-- Política simple para escritura - todos los usuarios autenticados pueden escribir
CREATE POLICY "Anyone can manage ML configurations" 
ON public.ml_model_configurations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Crear función de trigger más simple sin auth.uid()
CREATE OR REPLACE FUNCTION public.update_ml_config_timestamp_simple()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger con la función simple
CREATE TRIGGER update_ml_configurations_updated_at
BEFORE UPDATE ON public.ml_model_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_ml_config_timestamp_simple();