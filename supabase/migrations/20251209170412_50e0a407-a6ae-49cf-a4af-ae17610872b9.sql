-- =====================================================
-- ENRIQUECIMIENTO CATÁLOGO VEHÍCULOS MERCADO MEXICANO
-- =====================================================

-- Paso 1: Desactivar marca "Vento" (es modelo VW, no marca)
UPDATE marcas_vehiculos 
SET activo = false 
WHERE id = '806b751d-ba18-46f0-b64f-9f74f8bf8ba2';

-- Paso 2: Modelos BYD (eléctricos/híbridos líderes en México)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Dolphin', 'hatchback', true),
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Yuan Plus', 'suv', true),
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Seal', 'sedán', true),
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Song Plus', 'suv', true),
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Han', 'sedán', true),
  ('bc2ad64c-b9b2-4cd2-b90d-810292caf8db', 'Shark', 'pickup', true)
ON CONFLICT DO NOTHING;

-- Paso 3: Modelos Chirey (marca china de rápido crecimiento)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Tiggo 4 Pro', 'suv', true),
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Tiggo 7 Pro', 'suv', true),
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Tiggo 8 Pro', 'suv', true),
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Omoda 5', 'suv', true),
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Omoda C5', 'suv', true),
  ('4e726638-fc68-4dfa-bafd-7d3c40f1fb42', 'Jaecoo 7', 'suv', true)
ON CONFLICT DO NOTHING;

-- Paso 4: Modelos Jetour
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('bee06ba5-c618-4dae-8dd3-56a7487d4a32', 'Dashing', 'suv', true),
  ('bee06ba5-c618-4dae-8dd3-56a7487d4a32', 'X70 Plus', 'suv', true),
  ('bee06ba5-c618-4dae-8dd3-56a7487d4a32', 'T2', 'suv', true)
ON CONFLICT DO NOTHING;

-- Paso 5: Modelos Haval
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('031b5bb7-4100-4886-9fe1-be9e58c02ef8', 'H6', 'suv', true),
  ('031b5bb7-4100-4886-9fe1-be9e58c02ef8', 'Jolion', 'suv', true),
  ('031b5bb7-4100-4886-9fe1-be9e58c02ef8', 'Dargo', 'suv', true),
  ('031b5bb7-4100-4886-9fe1-be9e58c02ef8', 'H9', 'suv', true)
ON CONFLICT DO NOTHING;

-- Paso 6: Modelos BAIC
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('c146c694-c32d-44c0-b223-36d02974d234', 'X35', 'suv', true),
  ('c146c694-c32d-44c0-b223-36d02974d234', 'X55', 'suv', true),
  ('c146c694-c32d-44c0-b223-36d02974d234', 'U5 Plus', 'sedán', true)
ON CONFLICT DO NOTHING;

-- Paso 7: Modelos Great Wall
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('34a2c5e6-200f-4b8d-8d8e-acc1f26a55cd', 'Poer', 'pickup', true),
  ('34a2c5e6-200f-4b8d-8d8e-acc1f26a55cd', 'Ora', 'hatchback', true),
  ('34a2c5e6-200f-4b8d-8d8e-acc1f26a55cd', 'Wingle', 'pickup', true)
ON CONFLICT DO NOTHING;

-- Paso 8: Modelos MG (expandir catálogo existente)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'HS', 'suv', true),
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'ZS', 'suv', true),
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'MG5 EV', 'sedán', true),
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'Marvel R', 'suv', true),
  ('81f429bf-3898-4379-b07c-64b649b5cdc1', 'Cyberster', 'deportivo', true)
ON CONFLICT DO NOTHING;

-- Paso 9: Modelos Hyundai (expandir)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Venue', 'suv', true),
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Kona', 'suv', true),
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Kona Electric', 'suv', true),
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Palisade', 'suv', true),
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Ioniq 5', 'suv', true),
  ('e80bacf5-c5de-4890-8804-7065fef366d8', 'Ioniq 6', 'sedán', true)
ON CONFLICT DO NOTHING;

-- Paso 10: Modelos Toyota (expandir)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('c3ed7176-3409-4433-9fc7-a86aeea7b986', 'Raize', 'suv', true),
  ('c3ed7176-3409-4433-9fc7-a86aeea7b986', 'Agya', 'hatchback', true),
  ('c3ed7176-3409-4433-9fc7-a86aeea7b986', 'GR86', 'deportivo', true),
  ('c3ed7176-3409-4433-9fc7-a86aeea7b986', 'bZ4X', 'suv', true),
  ('c3ed7176-3409-4433-9fc7-a86aeea7b986', 'Tundra', 'pickup', true)
ON CONFLICT DO NOTHING;

-- Paso 11: Modelos Ford (expandir)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo) VALUES
  ('239a2f7d-78e5-4762-9d06-a63a109c09de', 'Maverick', 'pickup', true),
  ('239a2f7d-78e5-4762-9d06-a63a109c09de', 'Territory', 'suv', true),
  ('239a2f7d-78e5-4762-9d06-a63a109c09de', 'Mustang Mach-E', 'suv', true),
  ('239a2f7d-78e5-4762-9d06-a63a109c09de', 'Bronco', 'suv', true)
ON CONFLICT DO NOTHING;