-- Primero verificar si existe un trigger problemático en stock_productos
-- y eliminarlo si es necesario

-- Agregar el campo updated_at si no existe
ALTER TABLE stock_productos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear o reemplazar la función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_stock_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS update_stock_productos_updated_at_trigger ON stock_productos;

-- Crear el trigger correcto
CREATE TRIGGER update_stock_productos_updated_at_trigger
  BEFORE UPDATE ON stock_productos
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_productos_updated_at();