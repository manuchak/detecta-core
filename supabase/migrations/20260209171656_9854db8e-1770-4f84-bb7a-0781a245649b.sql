
-- Tabla para tarifas escalonadas por KM de armados internos (SEICSA)
CREATE TABLE public.tarifas_km_armados_internos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  km_min INTEGER NOT NULL DEFAULT 0,
  km_max INTEGER, -- NULL = sin límite
  tarifa_por_km NUMERIC(10,2) NOT NULL,
  descripcion TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarifas_km_armados_internos ENABLE ROW LEVEL SECURITY;

-- Policies - readable by all authenticated users, editable by authenticated users
CREATE POLICY "Authenticated users can view tarifas km"
  ON public.tarifas_km_armados_internos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tarifas km"
  ON public.tarifas_km_armados_internos FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tarifas km"
  ON public.tarifas_km_armados_internos FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tarifas km"
  ON public.tarifas_km_armados_internos FOR DELETE
  TO authenticated USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_tarifas_km_armados_internos_updated_at
  BEFORE UPDATE ON public.tarifas_km_armados_internos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data con las tarifas actuales hardcodeadas
INSERT INTO public.tarifas_km_armados_internos (km_min, km_max, tarifa_por_km, descripcion, orden) VALUES
  (0, 100, 6.0, '0-100 km', 1),
  (100, 250, 5.5, '101-250 km', 2),
  (250, 400, 5.0, '251-400 km', 3),
  (400, NULL, 4.6, '400+ km', 4);
