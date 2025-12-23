
-- Agregar modelos faltantes para Supply (Jennifer)
-- Chevrolet Groove y MG MG4

INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, año_inicio, activo)
VALUES 
  ('605990b9-e9d7-43f9-b1c7-a2ca0243a6ca', 'Groove', 'suv', 2020, true),
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'MG4', 'hatchback', 2022, true)
ON CONFLICT (marca_id, nombre) DO NOTHING;
