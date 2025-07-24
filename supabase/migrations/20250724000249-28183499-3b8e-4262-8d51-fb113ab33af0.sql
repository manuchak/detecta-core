-- Add subcategoria_id column to gastos_externos table
ALTER TABLE gastos_externos 
ADD COLUMN subcategoria_id UUID REFERENCES subcategorias_gastos(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gastos_externos_subcategoria_id ON gastos_externos(subcategoria_id);