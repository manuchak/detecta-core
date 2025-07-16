-- Crear tabla de proveedores
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  razon_social TEXT,
  rfc TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  codigo_postal TEXT,
  contacto_principal TEXT,
  telefono_contacto TEXT,
  email_contacto TEXT,
  terminos_pago TEXT DEFAULT '30 días',
  descuento_general NUMERIC DEFAULT 0,
  dias_credito INTEGER DEFAULT 30,
  limite_credito NUMERIC DEFAULT 0,
  calificacion INTEGER DEFAULT 5 CHECK (calificacion >= 1 AND calificacion <= 5),
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de relación productos-proveedores
CREATE TABLE public.producto_proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos_inventario(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  precio_compra NUMERIC NOT NULL DEFAULT 0,
  tiempo_entrega_dias INTEGER DEFAULT 7,
  cantidad_minima INTEGER DEFAULT 1,
  es_proveedor_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(producto_id, proveedor_id)
);

-- Habilitar RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proveedores
CREATE POLICY "Allow all for authenticated users on proveedores" 
ON public.proveedores 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas RLS para producto_proveedores
CREATE POLICY "Allow all for authenticated users on producto_proveedores" 
ON public.producto_proveedores 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_producto_proveedores_updated_at
  BEFORE UPDATE ON public.producto_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos proveedores de ejemplo
INSERT INTO public.proveedores (nombre, razon_social, email, telefono, ciudad, estado) VALUES
('TechGPS Solutions', 'TechGPS Solutions SA de CV', 'ventas@techgps.com', '5551234567', 'Ciudad de México', 'CDMX'),
('GPS Innovación', 'GPS Innovación y Tecnología SA', 'contacto@gpsinnovacion.com', '5557654321', 'Guadalajara', 'Jalisco'),
('Rastreadores Premium', 'Rastreadores Premium SRL', 'info@rastreadorespremium.com', '5559876543', 'Monterrey', 'Nuevo León');