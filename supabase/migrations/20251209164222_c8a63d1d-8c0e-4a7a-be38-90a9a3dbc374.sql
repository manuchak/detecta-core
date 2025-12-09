-- Agregar modelos VW faltantes al catálogo de vehículos
-- Incluye Virtus (reportado por Supply), SUVs populares, eléctricos y comerciales

INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
VALUES
  -- Sedanes faltantes
  ('83f95771-e008-4204-acf4-d4441828e951', 'Virtus', 'sedán', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'Bora', 'sedán', true),
  
  -- SUVs faltantes (muy populares en México 2024-2025)
  ('83f95771-e008-4204-acf4-d4441828e951', 'Taigun', 'suv', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'Nivus', 'crossover', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'Taos', 'suv', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'Teramont', 'suv', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'Cross Sport', 'suv', true),
  
  -- Eléctricos (línea ID)
  ('83f95771-e008-4204-acf4-d4441828e951', 'ID.4', 'suv', true),
  ('83f95771-e008-4204-acf4-d4441828e951', 'ID.5', 'suv', true),
  
  -- Van comercial
  ('83f95771-e008-4204-acf4-d4441828e951', 'Caddy', 'van', true)
ON CONFLICT DO NOTHING;