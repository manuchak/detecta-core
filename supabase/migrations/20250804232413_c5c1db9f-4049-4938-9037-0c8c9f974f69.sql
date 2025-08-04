-- Corregir la función actualizar_valor_inventario para eliminar la referencia 
-- a la columna 'valor_inventario' que no existe en productos_inventario
-- Esta función será simplificada para no hacer nada por ahora, 
-- ya que el valor del inventario se puede calcular dinámicamente

CREATE OR REPLACE FUNCTION public.actualizar_valor_inventario()
RETURNS TRIGGER AS $$
BEGIN
  -- Función simplificada - el valor del inventario se calcula dinámicamente
  -- No necesitamos actualizar ninguna columna específica
  -- Solo retornamos NEW para que el trigger no falle
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';