-- Create table for currency exchange rate configuration
CREATE TABLE public.configuracion_moneda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moneda_base TEXT NOT NULL DEFAULT 'USD',
  moneda_destino TEXT NOT NULL DEFAULT 'MXN', 
  tipo_cambio NUMERIC NOT NULL DEFAULT 20.0,
  fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actualizado_por UUID REFERENCES auth.users(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default exchange rate USD to MXN
INSERT INTO public.configuracion_moneda (moneda_base, moneda_destino, tipo_cambio) 
VALUES ('USD', 'MXN', 20.0);

-- Enable RLS
ALTER TABLE public.configuracion_moneda ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view currency config" 
ON public.configuracion_moneda 
FOR SELECT 
USING (activo = true);

CREATE POLICY "Only admins can manage currency config" 
ON public.configuracion_moneda 
FOR ALL 
USING (can_manage_wms());

-- Create trigger to update timestamp
CREATE TRIGGER update_configuracion_moneda_updated_at
BEFORE UPDATE ON public.configuracion_moneda
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();