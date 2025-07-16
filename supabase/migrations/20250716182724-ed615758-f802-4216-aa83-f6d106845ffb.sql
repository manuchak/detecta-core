-- Crear tabla para configuración del sistema WMS
CREATE TABLE IF NOT EXISTS public.configuracion_wms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_minimo_default INTEGER NOT NULL DEFAULT 5,
    stock_maximo_default INTEGER NOT NULL DEFAULT 100,
    moneda_default TEXT NOT NULL DEFAULT 'MXN',
    ubicacion_almacen_default TEXT NOT NULL DEFAULT 'A-1-1',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.configuracion_wms ENABLE ROW LEVEL SECURITY;

-- Create policies using existing admin function
CREATE POLICY "Admins can manage WMS configuration"
ON public.configuracion_wms
FOR ALL
USING (is_admin_user_secure())
WITH CHECK (is_admin_user_secure());

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_configuracion_wms_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_configuracion_wms_updated_at
    BEFORE UPDATE ON public.configuracion_wms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_configuracion_wms_timestamp();

-- Insert default configuration if none exists
INSERT INTO public.configuracion_wms (
    stock_minimo_default,
    stock_maximo_default,
    moneda_default,
    ubicacion_almacen_default,
    updated_by
) 
SELECT 5, 100, 'MXN', 'A-1-1', (
    SELECT id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1
)
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion_wms);