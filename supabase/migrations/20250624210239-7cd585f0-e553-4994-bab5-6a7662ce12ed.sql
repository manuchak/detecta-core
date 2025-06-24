
-- Actualizar y agregar modelos de dashcam de Jimi IoT
-- Primero actualizamos los modelos existentes y luego agregamos los nuevos dashcams

-- Actualizar modelos existentes de Jimi IoT para mejor información
UPDATE modelos_gps 
SET 
  tipo_dispositivo = 'tracker',
  protocolo_comunicacion = ARRAY['TCP', 'UDP'],
  conectividad = ARRAY['2G', '3G', '4G'],
  gps_precision = '3m CEP',
  bateria_interna = false,
  alimentacion_externa = '9-36V',
  entradas_digitales = 3,
  salidas_digitales = 2,
  entradas_analogicas = 2,
  sensores_soportados = ARRAY['Accelerometer', 'Temperature', 'GPS'],
  temperatura_operacion = '-20°C to +70°C',
  certificaciones = ARRAY['CE', 'FCC'],
  dimensiones = '90 x 60 x 25 mm',
  peso_gramos = 85,
  resistencia_agua = 'IP65',
  precio_referencia_usd = 42,
  disponible_mexico = true,
  activo = true
WHERE nombre = 'JM01' AND marca_id IN (SELECT id FROM marcas_gps WHERE nombre = 'Jimi IoT');

UPDATE modelos_gps 
SET 
  tipo_dispositivo = 'personal_tracker',
  protocolo_comunicacion = ARRAY['TCP', 'UDP'],
  conectividad = ARRAY['2G', '3G'],
  gps_precision = '5m CEP',
  bateria_interna = true,
  alimentacion_externa = 'USB',
  entradas_digitales = 1,
  salidas_digitales = 0,
  entradas_analogicas = 0,
  sensores_soportados = ARRAY['Accelerometer', 'GPS'],
  temperatura_operacion = '-10°C to +60°C',
  certificaciones = ARRAY['CE'],
  dimensiones = '45 x 35 x 15 mm',
  peso_gramos = 35,
  resistencia_agua = 'IP54',
  precio_referencia_usd = 22,
  disponible_mexico = true,
  activo = true
WHERE nombre = 'VL01E' AND marca_id IN (SELECT id FROM marcas_gps WHERE nombre = 'Jimi IoT');

-- Agregar todos los modelos de dashcam de Jimi IoT
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
  -- JIMI IoT - Serie Dashcam Profesional
  ('Jimi IoT', 'JC400P', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['4G Camera', 'GPS', 'Live Streaming'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '125 x 80 x 35 mm', 195, 'IP65', 165, true, true),
  ('Jimi IoT', 'JC400D', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Dual Camera', 'GPS', '4G'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '130 x 85 x 38 mm', 215, 'IP65', 185, true, true),
  ('Jimi IoT', 'JC450', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 5, 3, 3, ARRAY['HD Camera', 'AI Detection', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '135 x 90 x 40 mm', 245, 'IP65', 205, true, true),
  ('Jimi IoT', 'JC261', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 2, ARRAY['Basic Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '115 x 70 x 30 mm', 165, 'IP54', 125, true, true),
  ('Jimi IoT', 'JC200E', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12V', 3, 2, 1, ARRAY['Fleet Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '110 x 68 x 28 mm', 155, 'IP54', 115, true, true),
  ('Jimi IoT', 'JC100', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Compact Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '85 x 55 x 22 mm', 105, 'IP54', 85, true, true),
  ('Jimi IoT', 'JC600', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 6, 4, 4, ARRAY['Advanced Camera', 'AI', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '140 x 95 x 45 mm', 275, 'IP67', 245, true, true),
  ('Jimi IoT', 'JM-LL01', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Fleet Camera', 'Live View', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '120 x 75 x 32 mm', 175, 'IP65', 145, true, true),
  ('Jimi IoT', 'JM-LL301', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Smart Camera', 'Cloud', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '125 x 78 x 35 mm', 185, 'IP54', 155, true, true),
  ('Jimi IoT', 'JC121', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12V', 2, 1, 1, ARRAY['Mini Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '75 x 50 x 20 mm', 95, 'IP54', 75, true, true),
  ('Jimi IoT', 'JC181', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Vehicle Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '115 x 70 x 30 mm', 165, 'IP65', 135, true, true),
  ('Jimi IoT', 'JC400B', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '24V', 4, 3, 2, ARRAY['Bus Camera', 'Passenger Monitor', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '145 x 95 x 45 mm', 295, 'IP67', 225, true, true),
  ('Jimi IoT', 'JC400T', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '24V', 5, 3, 3, ARRAY['Truck Camera', 'Heavy Duty', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '150 x 100 x 50 mm', 325, 'IP67', 245, true, true),
  ('Jimi IoT', 'JC260', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12V', 3, 2, 1, ARRAY['Taxi Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '108 x 68 x 26 mm', 145, 'IP54', 105, true, true),
  ('Jimi IoT', 'JC300', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Professional Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '120 x 75 x 32 mm', 185, 'IP65', 165, true, true),
  ('Jimi IoT', 'JM-VG01U', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Basic Dash Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '90 x 60 x 25 mm', 115, 'IP54', 95, true, true),
  ('Jimi IoT', 'JC400F', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Fleet Camera', 'Driver Monitor', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '128 x 82 x 38 mm', 205, 'IP65', 175, true, true),
  ('Jimi IoT', 'JC400S', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Security Camera', 'Night Vision', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '118 x 75 x 32 mm', 175, 'IP65', 155, true, true),
  ('Jimi IoT', 'JC400A', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 5, 3, 3, ARRAY['AI Camera', 'Advanced Analytics', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '132 x 88 x 42 mm', 255, 'IP65', 225, true, true),
  ('Jimi IoT', 'JC400M', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12V', 3, 2, 1, ARRAY['Motorcycle Camera', 'Compact', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '95 x 55 x 22 mm', 125, 'IP65', 115, true, true),
  ('Jimi IoT', 'JC400R', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12V', 3, 2, 2, ARRAY['Rental Camera', 'Usage Monitor', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '115 x 70 x 28 mm', 165, 'IP54', 125, true, true),
  ('Jimi IoT', 'JC500', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 6, 4, 4, ARRAY['Premium Camera', 'Multi-angle', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '145 x 100 x 55 mm', 315, 'IP67', 285, true, true),
  ('Jimi IoT', 'JC151', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12V', 2, 1, 1, ARRAY['Entry Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '88 x 58 x 24 mm', 125, 'IP54', 85, true, true),
  ('Jimi IoT', 'JC400C', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Cloud Camera', 'Remote Access', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '122 x 78 x 35 mm', 195, 'IP54', 165, true, true),
  ('Jimi IoT', 'JC400E', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Emergency Camera', 'Panic Button', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '125 x 80 x 35 mm', 205, 'IP65', 185, true, true),
  ('Jimi IoT', 'JC400L', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 1, ARRAY['Live Stream Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '120 x 75 x 30 mm', 185, 'IP54', 155, true, true),
  ('Jimi IoT', 'JC400N', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Night Vision Camera', 'Low Light', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '118 x 75 x 32 mm', 195, 'IP65', 175, true, true),
  ('Jimi IoT', 'JC400V', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 5, 3, 3, ARRAY['Vehicle Fleet Camera', 'Multi-sensor', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '135 x 90 x 42 mm', 235, 'IP65', 205, true, true),
  ('Jimi IoT', 'JC400W', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['WiFi Camera', 'Wireless', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '125 x 78 x 35 mm', 215, 'IP54', 185, true, true),
  ('Jimi IoT', 'JC400X', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 6, 4, 4, ARRAY['Extreme Camera', '4K Recording', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '140 x 95 x 50 mm', 295, 'IP67', 265, true, true)
) AS modelos(
  marca_nombre, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
) ON m.nombre = modelos.marca_nombre
WHERE NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = modelos.nombre AND marca_id = m.id);
