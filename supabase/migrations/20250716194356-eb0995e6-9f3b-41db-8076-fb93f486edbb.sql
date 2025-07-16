-- Crear tabla para manejar lotes de compra con precios variables
CREATE TABLE IF NOT EXISTS public.lotes_inventario (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES productos_inventario(id) ON DELETE CASCADE,
    numero_lote TEXT NOT NULL,
    cantidad_inicial INTEGER NOT NULL,
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    costo_unitario NUMERIC(12,2) NOT NULL,
    fecha_compra TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE,
    proveedor_id UUID REFERENCES proveedores(id),
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear función para calcular costo promedio ponderado
CREATE OR REPLACE FUNCTION public.calcular_costo_promedio_ponderado(p_producto_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_cantidad INTEGER := 0;
    total_valor NUMERIC := 0;
    costo_promedio NUMERIC := 0;
BEGIN
    -- Sumar cantidad y valor total de todos los lotes activos
    SELECT 
        COALESCE(SUM(cantidad_disponible), 0),
        COALESCE(SUM(cantidad_disponible * costo_unitario), 0)
    INTO total_cantidad, total_valor
    FROM public.lotes_inventario 
    WHERE producto_id = p_producto_id 
    AND activo = true 
    AND cantidad_disponible > 0;
    
    -- Calcular promedio ponderado
    IF total_cantidad > 0 THEN
        costo_promedio := total_valor / total_cantidad;
    ELSE
        costo_promedio := 0;
    END IF;
    
    RETURN costo_promedio;
END;
$$ LANGUAGE plpgsql;

-- Crear función para calcular valor total del inventario
CREATE OR REPLACE FUNCTION public.calcular_valor_inventario(p_producto_id UUID)
RETURNS TABLE(
    valor_costo NUMERIC,
    valor_venta NUMERIC,
    margen_potencial NUMERIC
) AS $$
DECLARE
    total_stock INTEGER := 0;
    costo_promedio NUMERIC := 0;
    precio_venta NUMERIC := 0;
BEGIN
    -- Obtener stock total y precio de venta
    SELECT 
        COALESCE(sp.cantidad_disponible, 0),
        COALESCE(pi.precio_venta_sugerido, 0)
    INTO total_stock, precio_venta
    FROM public.stock_productos sp
    JOIN public.productos_inventario pi ON pi.id = sp.producto_id
    WHERE sp.producto_id = p_producto_id;
    
    -- Calcular costo promedio
    costo_promedio := public.calcular_costo_promedio_ponderado(p_producto_id);
    
    RETURN QUERY SELECT 
        (total_stock * costo_promedio) as valor_costo,
        (total_stock * precio_venta) as valor_venta,
        ((total_stock * precio_venta) - (total_stock * costo_promedio)) as margen_potencial;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar costo promedio automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_costo_promedio()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar precio_compra_promedio en productos_inventario
    UPDATE public.productos_inventario 
    SET precio_compra_promedio = public.calcular_costo_promedio_ponderado(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.producto_id 
            ELSE NEW.producto_id 
        END
    ),
    updated_at = now()
    WHERE id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.producto_id 
        ELSE NEW.producto_id 
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para mantener costos actualizados
CREATE TRIGGER trigger_actualizar_costo_promedio_insert
    AFTER INSERT ON public.lotes_inventario
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_costo_promedio();

CREATE TRIGGER trigger_actualizar_costo_promedio_update
    AFTER UPDATE ON public.lotes_inventario
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_costo_promedio();

CREATE TRIGGER trigger_actualizar_costo_promedio_delete
    AFTER DELETE ON public.lotes_inventario
    FOR EACH ROW EXECUTE FUNCTION public.actualizar_costo_promedio();

-- Crear vista para análisis de inventario
CREATE OR REPLACE VIEW public.vista_analisis_inventario AS
SELECT 
    pi.id,
    pi.nombre,
    pi.codigo_producto,
    sp.cantidad_disponible,
    pi.precio_compra_promedio,
    pi.precio_venta_sugerido,
    (sp.cantidad_disponible * pi.precio_compra_promedio) as valor_inventario_costo,
    (sp.cantidad_disponible * pi.precio_venta_sugerido) as valor_inventario_venta,
    ((sp.cantidad_disponible * pi.precio_venta_sugerido) - (sp.cantidad_disponible * pi.precio_compra_promedio)) as margen_potencial,
    CASE 
        WHEN pi.precio_compra_promedio > 0 
        THEN ROUND(((pi.precio_venta_sugerido - pi.precio_compra_promedio) / pi.precio_compra_promedio * 100), 2)
        ELSE 0 
    END as porcentaje_margen,
    COUNT(li.id) as total_lotes,
    COUNT(CASE WHEN li.cantidad_disponible > 0 THEN 1 END) as lotes_activos
FROM public.productos_inventario pi
LEFT JOIN public.stock_productos sp ON pi.id = sp.producto_id
LEFT JOIN public.lotes_inventario li ON pi.id = li.producto_id AND li.activo = true
GROUP BY pi.id, pi.nombre, pi.codigo_producto, sp.cantidad_disponible, 
         pi.precio_compra_promedio, pi.precio_venta_sugerido;

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.lotes_inventario ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can manage inventory batches"
ON public.lotes_inventario
FOR ALL
USING (can_manage_wms())
WITH CHECK (can_manage_wms());

-- Crear índices para optimizar performance
CREATE INDEX idx_lotes_inventario_producto_id ON public.lotes_inventario(producto_id);
CREATE INDEX idx_lotes_inventario_fecha_compra ON public.lotes_inventario(fecha_compra);
CREATE INDEX idx_lotes_inventario_activo ON public.lotes_inventario(activo);
CREATE INDEX idx_lotes_inventario_cantidad_disponible ON public.lotes_inventario(cantidad_disponible);