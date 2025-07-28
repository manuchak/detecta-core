-- Crear políticas para la tabla forecast_config
CREATE POLICY "Allow authenticated users to read forecast config" 
ON public.forecast_config 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert forecast config" 
ON public.forecast_config 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update forecast config" 
ON public.forecast_config 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Crear políticas para la tabla users (si existe)
CREATE POLICY "Allow authenticated users to read users" 
ON auth.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Verificar si la tabla forecast_config existe, si no, crearla
CREATE TABLE IF NOT EXISTS public.forecast_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_type TEXT NOT NULL DEFAULT 'global',
  alpha DECIMAL(3,2) DEFAULT 0.3,
  beta DECIMAL(3,2) DEFAULT 0.3,
  gamma DECIMAL(3,2) DEFAULT 0.3,
  use_manual BOOLEAN DEFAULT false,
  show_advanced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en forecast_config si no está habilitado
ALTER TABLE public.forecast_config ENABLE ROW LEVEL SECURITY;