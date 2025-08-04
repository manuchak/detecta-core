-- Corregir la función que está causando el error
-- La función actualizar_valor_inventario está referenciando la tabla 'productos' 
-- que no existe, debe usar 'productos_inventario'

CREATE OR REPLACE FUNCTION public.actualizar_valor_inventario()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular valor del inventario cuando cambia el stock
  -- Cambiar 'productos' por 'productos_inventario'
  UPDATE public.productos_inventario
  SET valor_inventario = (
    SELECT COALESCE(SUM(sp.cantidad_disponible * pi.precio_compra_promedio), 0)
    FROM public.stock_productos sp
    JOIN public.productos_inventario pi ON sp.producto_id = pi.id
    WHERE sp.producto_id = NEW.producto_id
  )
  WHERE id = NEW.producto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';