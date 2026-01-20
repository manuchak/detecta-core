-- =====================================================
-- Migración: Agregar vehículos solicitados por Supply
-- Fecha: 2026-01-20
-- Solicitudes: Brenda (Suzuki Ertiga XL7), Carlos (Changan Alsvin)
-- =====================================================

-- 1. Agregar marca Changan (China)
INSERT INTO marcas_vehiculos (nombre, pais_origen, activo)
VALUES ('Changan', 'China', true);

-- 2. Agregar modelo Ertiga XL7 a Suzuki existente
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
VALUES (
  'c7d2ffe3-f68c-476d-8ef1-3267254c5527',
  'Ertiga XL7', 
  'suv', 
  true
);

-- 3. Agregar modelo Alsvin a Changan (usando subquery para obtener el ID)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, 'Alsvin', 'sedán', true
FROM marcas_vehiculos 
WHERE nombre = 'Changan';