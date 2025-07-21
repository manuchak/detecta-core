-- Crear tabla para configuraciones de modelos ML
CREATE TABLE public.ml_model_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  hyperparameters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.ml_model_configurations ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer configuraciones
CREATE POLICY "Users can read ML configurations" 
ON public.ml_model_configurations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para que solo admins pueden modificar configuraciones
CREATE POLICY "Admins can manage ML configurations" 
ON public.ml_model_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'manager')
  )
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ml_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ml_configurations_updated_at
BEFORE UPDATE ON public.ml_model_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_ml_config_timestamp();

-- Insertar configuraciones por defecto
INSERT INTO public.ml_model_configurations (model_id, model_name, hyperparameters) VALUES
('linear_regression', 'Regresión Lineal', '{"learning_rate": 0.01, "regularization": 0.1}'),
('decision_tree', 'Árbol de Decisión', '{"max_depth": 10, "min_samples_split": 5}'),
('kmeans_clustering', 'K-Means Clustering', '{"n_clusters": 4, "max_iter": 100}');