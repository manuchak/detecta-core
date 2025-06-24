
-- Agregar todos los modelos disponibles de las marcas principales
-- TELTONIKA - Modelos completos de su catálogo oficial
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, modelos.nombre, modelos.tipo_dispositivo, modelos.protocolo_comunicacion, modelos.conectividad,
  modelos.gps_precision, modelos.bateria_interna, modelos.alimentacion_externa, modelos.entradas_digitales,
  modelos.salidas_digitales, modelos.entradas_analogicas, modelos.sensores_soportados, modelos.temperatura_operacion,
  modelos.certificaciones, modelos.dimensiones, modelos.peso_gramos, modelos.resistencia_agua, modelos.precio_referencia_usd,
  modelos.disponible_mexico, modelos.activo
FROM marcas_gps m
JOIN (VALUES
  -- TELTONIKA - Serie FMB (Basic Trackers)
  ('Teltonika', 'FMB003', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 2, 1, 1, ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '56 x 39 x 15 mm', 48, 'IP67', 42, true, true),
  ('Teltonika', 'FMB900', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'Bluetooth'], '2.5m CEP', true, '9-30V', 4, 2, 2, ARRAY['Accelerometer', 'Gyroscope', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC'], '89 x 79 x 22 mm', 128, 'IP67', 82, true, true),
  ('Teltonika', 'FMB962', 'tracker', ARRAY['TCP', 'UDP', 'SMS', 'MQTT'], ARRAY['2G', '3G', '4G', 'Bluetooth', 'WiFi'], '2.5m CEP', true, '9-30V', 6, 4, 4, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'Magnetometer'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC', 'PTCRB'], '89 x 79 x 22 mm', 148, 'IP67', 152, true, true),
  ('Teltonika', 'FMB965', 'tracker', ARRAY['TCP', 'UDP', 'SMS', 'MQTT'], ARRAY['2G', '3G', '4G', 'Bluetooth', 'WiFi'], '2.5m CEP', true, '9-30V', 6, 4, 4, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC', 'PTCRB'], '89 x 79 x 22 mm', 152, 'IP67', 165, true, true),
  
  -- TELTONIKA - Serie FMC (CAN Trackers)
  ('Teltonika', 'FMC003', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'CAN'], '2.5m CEP', true, '8-30V', 2, 1, 1, ARRAY['CAN', 'Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '56 x 39 x 15 mm', 52, 'IP67', 55, true, true),
  ('Teltonika', 'FMC130', 'can_tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '8-30V', 4, 2, 2, ARRAY['CAN', 'Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '83 x 60 x 19 mm', 90, 'IP67', 79, true, true),
  ('Teltonika', 'FMC640', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '9-30V', 4, 2, 2, ARRAY['CAN', 'Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '89 x 79 x 22 mm', 130, 'IP67', 85, true, true),
  ('Teltonika', 'FMC920', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '9-30V', 4, 2, 2, ARRAY['CAN', 'Accelerometer', 'Gyroscope'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '89 x 79 x 22 mm', 135, 'IP67', 92, true, true),
  
  -- TELTONIKA - Serie FMU (Universal Trackers)
  ('Teltonika', 'FMU126', 'universal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 6, 3, 3, ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '79 x 65 x 19 mm', 92, 'IP67', 72, true, true),
  ('Teltonika', 'FMU130', 'universal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 6, 3, 3, ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '83 x 60 x 19 mm', 95, 'IP67', 82, true, true),
  
  -- TELTONIKA - Serie FMA (Asset Trackers)
  ('Teltonika', 'FMA110', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, 'Batería', 2, 0, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '85 x 60 x 22 mm', 88, 'IP67', 65, true, true),
  ('Teltonika', 'FMA204', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, 'Batería', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '66 x 46 x 16 mm', 72, 'IP67', 68, true, true),
  
  -- TELTONIKA - Serie GH (Personal Trackers)
  ('Teltonika', 'GH3000', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +55°C', ARRAY['CE', 'FCC'], '50 x 36 x 15 mm', 38, 'IP54', 32, true, true),
  ('Teltonika', 'GH5200', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'WiFi'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +55°C', ARRAY['CE', 'FCC'], '52 x 38 x 16 mm', 42, 'IP54', 38, true, true),
  
  -- TELTONIKA - Serie TMT (Bluetooth Beacons/IoT)
  ('Teltonika', 'TMT250', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'NB-IoT'], '3m CEP', true, 'Batería', 1, 0, 0, ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '88 x 71 x 23 mm', 110, 'IP67', 85, true, true),
  ('Teltonika', 'TFT100', 'fleet_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'WiFi'], '2.5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer', 'Temperature'], '-10°C to +55°C', ARRAY['CE', 'FCC'], '44 x 44 x 15 mm', 40, 'IP65', 48, true, true),
  
  -- SUNTECH - Catálogo completo de modelos disponibles
  ('Suntech', 'ST300', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '3m CEP', false, '9-32V', 3, 2, 1, ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '95 x 60 x 25 mm', 110, 'IP65', 65, true, true),
  ('Suntech', 'ST310U', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '3m CEP', false, '9-32V', 3, 2, 1, ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '95 x 60 x 25 mm', 115, 'IP65', 68, true, true),
  ('Suntech', 'ST340', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '100 x 65 x 28 mm', 120, 'IP65', 72, true, true),
  ('Suntech', 'ST340LC', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '100 x 65 x 28 mm', 122, 'IP65', 75, true, true),
  ('Suntech', 'ST600', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '100 x 65 x 28 mm', 125, 'IP65', 72, true, true),
  ('Suntech', 'ST3940', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '105 x 68 x 28 mm', 135, 'IP65', 78, true, true),
  ('Suntech', 'ST4215', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '105 x 68 x 28 mm', 138, 'IP65', 82, true, true),
  ('Suntech', 'ST4940', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '105 x 68 x 28 mm', 142, 'IP65', 88, true, true),
  ('Suntech', 'ST3955', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, 'Batería', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '90 x 62 x 24 mm', 105, 'IP67', 88, true, true),
  ('Suntech', 'ST4955', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', true, 'Batería', 3, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '95 x 65 x 25 mm', 118, 'IP67', 95, true, true),
  ('Suntech', 'ST8200A', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', false, '9-32V', 6, 3, 3, ARRAY['CAN', 'Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '120 x 80 x 32 mm', 185, 'IP65', 155, true, true),
  ('Suntech', 'ST8300', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', false, '9-32V', 8, 4, 4, ARRAY['CAN', 'Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '125 x 85 x 35 mm', 205, 'IP65', 175, true, true),
  ('Suntech', 'ST7200A', 'fleet_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', false, '9-32V', 6, 3, 3, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '115 x 75 x 30 mm', 165, 'IP65', 138, true, true),
  ('Suntech', 'ST8910', 'marine_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '110 x 70 x 28 mm', 155, 'IP67', 125, true, true),
  
  -- CONCOX - Catálogo completo disponible
  ('Concox', 'GT06', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G'], '5m CEP', false, '9-36V', 1, 1, 0, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '75 x 50 x 20 mm', 55, 'IP54', 18, true, true),
  ('Concox', 'GT06E', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '80 x 52 x 22 mm', 58, 'IP54', 20, true, true),
  ('Concox', 'GT08', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '80 x 52 x 22 mm', 60, 'IP54', 22, true, true),
  ('Concox', 'AT3', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '3m CEP', false, '9-36V', 3, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE'], '95 x 56 x 25 mm', 85, 'IP67', 38, true, true),
  ('Concox', 'AT5', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '9-36V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE'], '100 x 60 x 28 mm', 95, 'IP67', 45, true, true),
  ('Concox', 'AT6', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '2.5m CEP', false, '9-36V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE'], '105 x 65 x 30 mm', 105, 'IP67', 52, true, true),
  ('Concox', 'QS90', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '85 x 50 x 22 mm', 68, 'IP65', 25, true, true),
  ('Concox', 'WeTrack', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '40 x 35 x 15 mm', 28, 'IP54', 14, true, true),
  ('Concox', 'WeTrack2', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '50 x 38 x 16 mm', 38, 'IP54', 20, true, true),
  ('Concox', 'WeTrack Lite', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '45 x 32 x 14 mm', 25, 'IP54', 12, true, true),
  ('Concox', 'HVT001', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '45 x 35 x 15 mm', 32, 'IP54', 16, true, true),
  ('Concox', 'OB22', 'obd_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'OBD'], '5m CEP', false, 'OBD-II', 0, 0, 0, ARRAY['OBD', 'Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '65 x 45 x 25 mm', 45, 'IP54', 25, true, true),
  ('Concox', 'OB32', 'obd_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'OBD'], '3m CEP', false, 'OBD-II', 0, 0, 0, ARRAY['OBD', 'Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '70 x 48 x 28 mm', 52, 'IP54', 32, true, true),
  ('Concox', 'OB500', 'obd_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'OBD'], '2.5m CEP', false, 'OBD-II', 0, 0, 0, ARRAY['OBD', 'Accelerometer', 'CAN'], '-20°C to +70°C', ARRAY['CE'], '75 x 50 x 30 mm', 62, 'IP54', 42, true, true),
  ('Concox', 'ET25', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'Batería', 1, 0, 0, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '95 x 65 x 25 mm', 95, 'IP67', 48, true, true),
  ('Concox', 'ET500', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, 'Batería', 2, 1, 1, ARRAY['Accelerometer', 'Temperature'], '-20°C to +70°C', ARRAY['CE'], '105 x 75 x 30 mm', 125, 'IP67', 65, true, true),
  ('Concox', 'JM-VL01', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '40 x 35 x 15 mm', 30, 'IP54', 18, true, true),
  ('Concox', 'JM-VG01U', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 1, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '48 x 38 x 17 mm', 42, 'IP54', 24, true, true),
  ('Concox', 'CRX1', 'motorcycle_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '90 x 55 x 25 mm', 75, 'IP65', 35, true, true)
) AS modelos(
  marca_nombre, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
) ON m.nombre = modelos.marca_nombre
WHERE NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = modelos.nombre AND marca_id = m.id);

-- Agregar opciones "Otro" para marca y modelo
INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Otro', 'Personalizado', '', false, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Otro');

-- Obtener el ID de la marca "Otro" y agregar modelo "Otro"
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'Otro', 'personalizado', ARRAY['TCP', 'UDP'], ARRAY['Personalizado'], 'Variable', false, 'Variable', 0,
  0, 0, ARRAY['Variable'], 'Variable', ARRAY['Variable'], 'Variable', 0, 'Variable', 0, true, true
FROM marcas_gps m WHERE m.nombre = 'Otro'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'Otro' AND marca_id = m.id);

-- También agregar modelo "Otro" para cada marca existente para flexibilidad
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'Otro', 'personalizado', ARRAY['TCP', 'UDP'], ARRAY['Variable'], 'Variable', false, 'Variable', 0,
  0, 0, ARRAY['Variable'], 'Variable', ARRAY['Variable'], 'Variable', 0, 'Variable', 0, true, true
FROM marcas_gps m 
WHERE m.nombre IN ('Teltonika', 'Suntech', 'Concox', 'Queclink', 'Meitrack', 'Calamp', 'Aplicom')
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'Otro' AND marca_id = m.id);
