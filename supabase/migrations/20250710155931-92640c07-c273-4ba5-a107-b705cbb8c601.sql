-- Crear tabla para configuración global del forecast
CREATE TABLE public.forecast_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL DEFAULT 'global',
  alpha NUMERIC NOT NULL DEFAULT 0.3,
  beta NUMERIC NOT NULL DEFAULT 0.1,
  gamma NUMERIC NOT NULL DEFAULT 0.1,
  use_manual BOOLEAN NOT NULL DEFAULT false,
  show_advanced BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.forecast_config ENABLE ROW LEVEL SECURITY;

-- Política para lectura: todos los usuarios autenticados pueden leer
CREATE POLICY "Users can read forecast config" ON public.forecast_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para escritura: solo admins y managers pueden modificar
CREATE POLICY "Admins can manage forecast config" ON public.forecast_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'manager')
    )
  );

-- Insertar configuración global por defecto
INSERT INTO public.forecast_config (config_type, alpha, beta, gamma, use_manual, show_advanced)
VALUES ('global', 0.3, 0.1, 0.1, false, false);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_forecast_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forecast_config_updated_at
  BEFORE UPDATE ON public.forecast_config
  FOR EACH ROW
  EXECUTE FUNCTION update_forecast_config_updated_at();