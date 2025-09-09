-- Add missing Kia models to the database
-- We already have Kia brand with ID 4f48a7f2-b148-465b-80d2-1f6338141a56

INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
-- Sonet - subcompact SUV available in Mexico
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Sonet', 'suv', true),

-- Soul - crossover/SUV
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Soul', 'suv', true),

-- K5 - mid-size sedan (replaced Optima)
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'K5', 'sedán', true),

-- Stinger - performance sedan/fastback
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Stinger', 'sedán', true),

-- EV6 - electric crossover SUV
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'EV6', 'suv', true),

-- Niro - hybrid/electric SUV
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Niro', 'suv', true),

-- Telluride - large SUV
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Telluride', 'suv', true),

-- Picanto - city car/hatchback
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Picanto', 'hatchback', true),

-- K4 - compact sedan (new model for 2025)
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'K4', 'sedán', true),

-- EV9 - large electric SUV
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'EV9', 'suv', true),

-- Mohave/Borrego - large SUV (available in some markets)
('4f48a7f2-b148-465b-80d2-1f6338141a56', 'Mohave', 'suv', true)

ON CONFLICT (marca_id, nombre) DO NOTHING;