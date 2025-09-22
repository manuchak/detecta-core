-- Create table for predefined meeting points
CREATE TABLE public.puntos_encuentro_predefinidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion_completa TEXT NOT NULL,
  coordenadas POINT,
  zona TEXT,
  categoria TEXT DEFAULT 'general', -- oficina, estacion, centro_comercial, etc.
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.puntos_encuentro_predefinidos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Usuarios autenticados pueden ver puntos de encuentro" 
ON public.puntos_encuentro_predefinidos 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND activo = true);

CREATE POLICY "Coordinadores pueden gestionar puntos de encuentro" 
ON public.puntos_encuentro_predefinidos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador')
  )
);

-- Insert some default meeting points
INSERT INTO public.puntos_encuentro_predefinidos (nombre, direccion_completa, zona, categoria, descripcion) VALUES
('Centro Comercial Santa Fe', 'Av. Vasco de Quiroga 3800, Santa Fe, Álvaro Obregón, CDMX', 'Santa Fe', 'centro_comercial', 'Estacionamiento nivel B2'),
('Metro Polanco', 'Av. Presidente Masaryk, Polanco, Miguel Hidalgo, CDMX', 'Polanco', 'estacion', 'Salida 2, junto al Oxxo'),
('Plaza Carso', 'Lago Zurich 245, Ampliación Granada, Miguel Hidalgo, CDMX', 'Polanco', 'centro_comercial', 'Lobby principal'),
('Antara Fashion Hall', 'Av. Ejército Nacional 843, Granada, Miguel Hidalgo, CDMX', 'Polanco', 'centro_comercial', 'Estacionamiento P1'),
('Centro Histórico - Zócalo', 'Plaza de la Constitución s/n, Centro Histórico, CDMX', 'Centro', 'punto_referencia', 'Lado norte de la plaza');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_puntos_encuentro_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_puntos_encuentro_updated_at
  BEFORE UPDATE ON public.puntos_encuentro_predefinidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_puntos_encuentro_timestamp();