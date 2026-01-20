-- =====================================================
-- Migración: Enriquecimiento Integral Base de Datos Vehículos
-- Fecha: 2026-01-20
-- Objetivo: ~75 modelos nuevos, 3 marcas nuevas
-- Usa ON CONFLICT para evitar duplicados
-- =====================================================

-- ============ PARTE 1: NUEVAS MARCAS ============

INSERT INTO marcas_vehiculos (nombre, pais_origen, activo) VALUES
('RAM', 'Estados Unidos', true),
('Volvo', 'Suecia', true),
('SEV', 'México', true)
ON CONFLICT (nombre) DO NOTHING;

-- ============ PARTE 2: MODELOS PARA MARCAS VACÍAS ============

-- DFSK (China)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Glory 500', 'suv'), ('Glory 560', 'suv'), ('Glory 580', 'suv'), 
        ('E5', 'suv eléctrico'), ('C35', 'van'), ('C37', 'van')) AS m(modelo, tipo)
WHERE nombre = 'DFSK'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Foton (China)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Tunland', 'pickup'), ('Tunland V', 'pickup'), ('View CS2', 'van'), 
        ('Aumark', 'camión ligero'), ('Gratour', 'van')) AS m(modelo, tipo)
WHERE nombre = 'Foton'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Geely (China)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Emgrand', 'sedán'), ('GX3 Pro', 'suv'), ('Coolray', 'suv'), 
        ('Starray', 'suv'), ('EX5', 'suv eléctrico'), ('Okavango', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Geely'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Mahindra (India)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Pik Up', 'pickup'), ('Scorpio', 'suv'), ('XUV500', 'suv'), ('Bolero', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Mahindra'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- DINA (México)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Runner 9400', 'camión'), ('Linner 9100', 'camión'), ('D-1134', 'autobús')) AS m(modelo, tipo)
WHERE nombre = 'DINA'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Mastretta (México)
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('MXT', 'coupé deportivo'), ('MXA', 'coupé deportivo')) AS m(modelo, tipo)
WHERE nombre = 'Mastretta'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- ============ PARTE 3: EXPANDIR CHANGAN ============

INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('CS35 Plus', 'suv'), ('CS55 Plus', 'suv'), ('CS75 Plus', 'suv'), 
        ('UNI-K', 'suv'), ('UNI-T', 'suv'), ('Hunter', 'pickup'), ('Deepal S05', 'suv eléctrico')) AS m(modelo, tipo)
WHERE nombre = 'Changan'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- ============ PARTE 4: COMPLETAR MARCAS CON POCOS MODELOS ============

-- Great Wall
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Poer', 'pickup'), ('Cannon', 'pickup'), ('Tank 300', 'suv'), 
        ('Tank 500', 'suv'), ('Ora 03', 'hatchback eléctrico')) AS m(modelo, tipo)
WHERE nombre = 'Great Wall'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Jetour
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Dashing', 'suv'), ('X70 Plus', 'suv'), ('X90 Plus', 'suv'), ('T2', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Jetour'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- BAIC
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('X7', 'suv'), ('BJ40', 'suv'), ('D20', 'sedán'), ('EU5', 'sedán eléctrico')) AS m(modelo, tipo)
WHERE nombre = 'BAIC'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- ============ PARTE 5: MODELOS PARA NUEVAS MARCAS ============

-- RAM
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('700', 'pickup'), ('1200', 'pickup'), ('1500', 'pickup'), 
        ('2500', 'pickup'), ('ProMaster', 'van')) AS m(modelo, tipo)
WHERE nombre = 'RAM'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Volvo
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('XC40', 'suv'), ('XC60', 'suv'), ('XC90', 'suv'), 
        ('EX30', 'suv eléctrico'), ('EX90', 'suv eléctrico'), ('S60', 'sedán'), ('S90', 'sedán')) AS m(modelo, tipo)
WHERE nombre = 'Volvo'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- SEV
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('E-Wan', 'hatchback eléctrico'), ('E-Wan Cross', 'suv eléctrico'), ('E-Sofi', 'hatchback eléctrico')) AS m(modelo, tipo)
WHERE nombre = 'SEV'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- ============ PARTE 6: MODELOS FALTANTES MARCAS POPULARES ============

-- Nissan
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Pathfinder', 'suv'), ('Frontier', 'pickup'), ('NP300', 'pickup')) AS m(modelo, tipo)
WHERE nombre = 'Nissan'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Kia
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('K3', 'sedán'), ('K4', 'sedán'), ('EV6', 'suv eléctrico'), ('Niro', 'suv híbrido')) AS m(modelo, tipo)
WHERE nombre = 'Kia'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Hyundai
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('HB20', 'hatchback'), ('Ioniq 5', 'suv eléctrico'), ('Ioniq 6', 'sedán eléctrico'), ('Palisade', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Hyundai'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Toyota
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('Corolla Cross', 'suv'), ('bZ4X', 'suv eléctrico'), ('Land Cruiser', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Toyota'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Honda
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('ZR-V', 'suv'), ('e:Ny1', 'suv eléctrico')) AS m(modelo, tipo)
WHERE nombre = 'Honda'
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- Volkswagen
INSERT INTO modelos_vehiculos (marca_id, nombre, tipo_vehiculo, activo)
SELECT id, modelo, tipo, true FROM marcas_vehiculos, 
(VALUES ('ID.4', 'suv eléctrico'), ('Tera', 'suv')) AS m(modelo, tipo)
WHERE nombre = 'Volkswagen'
ON CONFLICT (marca_id, nombre) DO NOTHING;