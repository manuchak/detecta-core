-- Crear tabla de stock de productos si no existe
CREATE TABLE IF NOT EXISTS public.stock_productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos_inventario(id) ON DELETE CASCADE,
  cantidad_disponible INTEGER NOT NULL DEFAULT 0,
  cantidad_reservada INTEGER NOT NULL DEFAULT 0,
  cantidad_transito INTEGER NOT NULL DEFAULT 0,
  cantidad_minima INTEGER NOT NULL DEFAULT 0,
  cantidad_maxima INTEGER,
  ubicacion_almacen TEXT,
  valor_inventario NUMERIC(10,2) DEFAULT 0,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(producto_id)
);

-- Crear tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.productos_inventario(id) ON DELETE CASCADE,
  tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'transferencia', 'reserva', 'liberacion')),
  cantidad INTEGER NOT NULL,
  cantidad_anterior INTEGER NOT NULL,
  cantidad_nueva INTEGER NOT NULL,
  motivo TEXT,
  referencia TEXT, -- Referencia a orden de compra, venta, etc.
  usuario_id UUID REFERENCES auth.users(id),
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de órdenes de compra si no existe
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_orden TEXT NOT NULL UNIQUE,
  proveedor_id UUID REFERENCES public.proveedores(id),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'confirmada', 'recibida_parcial', 'recibida_completa', 'cancelada')),
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_esperada DATE,
  subtotal NUMERIC(10,2) DEFAULT 0,
  impuestos NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de proveedores si no existe
CREATE TABLE IF NOT EXISTS public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_proveedor TEXT UNIQUE,
  nombre TEXT NOT NULL,
  razon_social TEXT,
  rfc TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'México',
  contacto_principal TEXT,
  terminos_pago TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de recepciones de mercancía si no existe
CREATE TABLE IF NOT EXISTS public.recepciones_mercancia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_recepcion TEXT NOT NULL UNIQUE,
  orden_compra_id UUID REFERENCES public.ordenes_compra(id),
  proveedor_id UUID REFERENCES public.proveedores(id),
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
  notas TEXT,
  recibido_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.stock_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepciones_mercancia ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para usuarios autenticados
CREATE POLICY "Allow all authenticated users stock_productos" ON public.stock_productos FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users movimientos_stock" ON public.movimientos_stock FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users ordenes_compra" ON public.ordenes_compra FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users proveedores" ON public.proveedores FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow all authenticated users recepciones_mercancia" ON public.recepciones_mercancia FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Crear triggers para actualizar timestamps
CREATE OR REPLACE TRIGGER update_stock_productos_updated_at
  BEFORE UPDATE ON public.stock_productos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_recepciones_mercancia_updated_at
  BEFORE UPDATE ON public.recepciones_mercancia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_productos_producto_id ON public.stock_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_producto_id ON public.movimientos_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_stock_fecha ON public.movimientos_stock(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_numero ON public.ordenes_compra(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado ON public.ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_recepciones_numero ON public.recepciones_mercancia(numero_recepcion);