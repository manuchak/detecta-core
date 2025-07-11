-- Crear tablas faltantes para el sistema de stock e inventario

-- Tabla para el stock de productos
CREATE TABLE IF NOT EXISTS public.stock_productos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES public.productos_inventario(id) ON DELETE CASCADE,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_reservada INTEGER NOT NULL DEFAULT 0,
    cantidad_transito INTEGER NOT NULL DEFAULT 0,
    valor_inventario NUMERIC(12,2) NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(producto_id)
);

-- Tabla para movimientos de inventario
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES public.productos_inventario(id) ON DELETE CASCADE,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'reserva', 'liberacion')),
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL DEFAULT 0,
    cantidad_nueva INTEGER NOT NULL DEFAULT 0,
    costo_unitario NUMERIC(10,2),
    valor_total NUMERIC(12,2),
    referencia_tipo TEXT,
    referencia_id TEXT,
    motivo TEXT,
    usuario_id UUID,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notas TEXT
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.stock_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para stock_productos
CREATE POLICY "supply_admin_full_access_stock" ON public.stock_productos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
);

-- Crear políticas RLS para movimientos_inventario
CREATE POLICY "supply_admin_full_access_movimientos" ON public.movimientos_inventario
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'supply')
  )
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_productos_producto_id ON public.stock_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto_id ON public.movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha ON public.movimientos_inventario(fecha_movimiento DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_tipo ON public.movimientos_inventario(tipo_movimiento);

-- Trigger para actualizar ultima_actualizacion en stock_productos
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_timestamp
    BEFORE UPDATE ON public.stock_productos
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_timestamp();