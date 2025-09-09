-- Add Kia K3 model to the database
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'K3', 'sedán', true)
ON CONFLICT (marca_id, nombre) DO NOTHING;