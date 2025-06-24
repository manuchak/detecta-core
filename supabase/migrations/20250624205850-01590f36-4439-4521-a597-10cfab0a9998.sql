
-- Agregar modelos de dashcam de las marcas principales
-- TELTONIKA - Serie dashcam y cámaras
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
  -- TELTONIKA - Serie Dashcam
  ('Teltonika', 'FMB001CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '4G', 'WiFi'], '2.5m CEP', true, '12-24V', 2, 1, 1, ARRAY['Camera', 'Accelerometer', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '110 x 75 x 30 mm', 180, 'IP65', 145, true, true),
  ('Teltonika', 'FMB920CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Camera', 'Accelerometer', 'Gyroscope'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '120 x 80 x 35 mm', 220, 'IP67', 185, true, true),
  ('Teltonika', 'FMC125CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Camera', 'CAN', 'Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '115 x 78 x 32 mm', 195, 'IP67', 165, true, true),
  ('Teltonika', 'FMB964CAM', 'dashcam', ARRAY['TCP', 'UDP', 'MQTT'], ARRAY['2G', '3G', '4G', 'WiFi'], '2.5m CEP', true, '12-24V', 6, 4, 4, ARRAY['Camera', 'Accelerometer', 'CAN'], '-30°C to +80°C', ARRAY['CE', 'FCC', 'PTCRB'], '125 x 85 x 40 mm', 245, 'IP67', 225, true, true),
  ('Teltonika', 'DualCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Dual Camera', 'GPS', 'G-Sensor'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '130 x 90 x 45 mm', 280, 'IP54', 195, true, true),
  ('Teltonika', 'FleetCam HD', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 1, ARRAY['HD Camera', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '125 x 80 x 35 mm', 210, 'IP65', 175, true, true),
  ('Teltonika', 'SmartCam 4K', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G', 'WiFi'], '2m CEP', true, '12-24V', 4, 3, 2, ARRAY['4K Camera', 'AI Detection', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '135 x 95 x 50 mm', 320, 'IP67', 285, true, true),
  ('Teltonika', 'TruckCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G', 'CAN'], '2.5m CEP', true, '24V', 6, 4, 3, ARRAY['Camera', 'CAN', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '140 x 100 x 55 mm', 350, 'IP67', 245, true, true),
  ('Teltonika', 'MiniCam GPS', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, '12V', 2, 1, 1, ARRAY['Compact Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '95 x 65 x 25 mm', 125, 'IP54', 95, true, true),
  ('Teltonika', 'AI Dashcam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 4, 2, 2, ARRAY['AI Camera', 'Face Recognition', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '128 x 88 x 42 mm', 265, 'IP65', 315, true, true),
  
  -- SUNTECH - Serie Dashcam
  ('Suntech', 'ST300CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, '12-24V', 3, 2, 1, ARRAY['Camera', 'GPS', 'Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '115 x 70 x 30 mm', 165, 'IP65', 125, true, true),
  ('Suntech', 'ST340CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, '12-24V', 4, 2, 2, ARRAY['HD Camera', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '120 x 75 x 32 mm', 185, 'IP65', 145, true, true),
  ('Suntech', 'ST600CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '3m CEP', true, '12-24V', 4, 2, 2, ARRAY['Camera', 'GPS', 'G-Sensor'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '125 x 80 x 35 mm', 205, 'IP65', 165, true, true),
  ('Suntech', 'ST4940CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Full HD Camera', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '130 x 85 x 38 mm', 225, 'IP65', 185, true, true),
  ('Suntech', 'DualView HD', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Dual Camera', 'GPS', 'WiFi'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '135 x 90 x 40 mm', 245, 'IP54', 205, true, true),
  ('Suntech', 'FleetCam 360', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 6, 3, 3, ARRAY['360° Camera', 'GPS', 'AI'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '150 x 100 x 60 mm', 385, 'IP65', 425, true, true),
  ('Suntech', 'SmartDash Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 2, ARRAY['Smart Camera', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '120 x 75 x 30 mm', 175, 'IP65', 155, true, true),
  ('Suntech', 'TruckEye HD', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '24V', 5, 3, 2, ARRAY['Heavy Duty Camera', 'GPS'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '145 x 95 x 45 mm', 295, 'IP67', 215, true, true),
  ('Suntech', 'CompactCam GPS', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, '12V', 2, 1, 1, ARRAY['Compact Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '90 x 60 x 25 mm', 115, 'IP54', 85, true, true),
  ('Suntech', 'AI FleetCam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 4, 2, 2, ARRAY['AI Camera', 'Driver Monitoring', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '132 x 87 x 43 mm', 255, 'IP65', 295, true, true),
  ('Suntech', 'NightVision Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12-24V', 3, 2, 1, ARRAY['Night Vision Camera', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '125 x 80 x 35 mm', 195, 'IP65', 175, true, true),
  ('Suntech', 'MultiCam Fleet', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 6, 4, 3, ARRAY['Multi Camera', 'GPS', 'Storage'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '155 x 105 x 65 mm', 425, 'IP65', 365, true, true),
  
  -- CONCOX - Serie Dashcam
  ('Concox', 'GT06CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Basic Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '85 x 55 x 25 mm', 95, 'IP54', 45, true, true),
  ('Concox', 'AT4CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 2, ARRAY['HD Camera', 'GPS', 'G-Sensor'], '-25°C to +75°C', ARRAY['CE'], '105 x 65 x 30 mm', 145, 'IP65', 85, true, true),
  ('Concox', 'AT6CAM', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Full HD Camera', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '115 x 70 x 32 mm', 165, 'IP65', 105, true, true),
  ('Concox', 'DashCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Professional Camera', 'GPS', 'Cloud'], '-20°C to +70°C', ARRAY['CE'], '120 x 75 x 35 mm', 185, 'IP54', 125, true, true),
  ('Concox', 'DualCam 4G', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '3m CEP', true, '12-24V', 3, 2, 1, ARRAY['Dual Camera', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '125 x 80 x 38 mm', 205, 'IP54', 145, true, true),
  ('Concox', 'SmartCam AI', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['AI Camera', 'Facial Recognition', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '128 x 85 x 40 mm', 225, 'IP54', 165, true, true),
  ('Concox', 'FleetVision HD', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 2, ARRAY['Fleet Camera', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '118 x 72 x 32 mm', 155, 'IP65', 115, true, true),
  ('Concox', 'TruckCam 4G', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '24V', 4, 3, 2, ARRAY['Heavy Duty Camera', 'GPS'], '-30°C to +80°C', ARRAY['CE'], '135 x 88 x 42 mm', 245, 'IP67', 135, true, true),
  ('Concox', 'MiniDash GPS', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Mini Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '80 x 50 x 22 mm', 85, 'IP54', 65, true, true),
  ('Concox', 'CloudCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 4, 2, 2, ARRAY['Cloud Camera', 'GPS', 'Storage'], '-20°C to +70°C', ARRAY['CE'], '122 x 78 x 35 mm', 175, 'IP54', 105, true, true),
  ('Concox', 'SecureCam Fleet', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 3, 2, 1, ARRAY['Security Camera', 'GPS', 'Alarm'], '-25°C to +75°C', ARRAY['CE'], '115 x 70 x 30 mm', 165, 'IP65', 95, true, true),
  ('Concox', 'NightEye Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Night Vision', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '120 x 75 x 32 mm', 185, 'IP54', 115, true, true),
  ('Concox', 'DriveGuard AI', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2m CEP', true, '12-24V', 4, 2, 2, ARRAY['AI Monitoring', 'Driver Alert', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '130 x 82 x 38 mm', 215, 'IP54', 155, true, true),
  ('Concox', 'MultiView Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', true, '12-24V', 5, 3, 3, ARRAY['Multi-angle Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '145 x 95 x 50 mm', 325, 'IP54', 185, true, true),
  ('Concox', 'StreamCam Live', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', '5G'], '2.5m CEP', true, '12-24V', 3, 2, 1, ARRAY['Live Streaming', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '125 x 78 x 35 mm', 195, 'IP54', 135, true, true),
  
  -- Modelos adicionales especializados para completar 50+
  ('Teltonika', 'SafeDrive Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12-24V', 3, 2, 2, ARRAY['Safety Camera', 'ADAS', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '120 x 78 x 33 mm', 185, 'IP65', 205, true, true),
  ('Teltonika', 'BusCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '24V', 6, 4, 3, ARRAY['Bus Camera', 'Passenger Monitor', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '150 x 100 x 55 mm', 365, 'IP67', 285, true, true),
  ('Teltonika', 'RearView Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12-24V', 2, 1, 1, ARRAY['Rear Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '95 x 65 x 25 mm', 125, 'IP67', 145, true, true),
  ('Teltonika', 'CargoWatch Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '24V', 4, 2, 2, ARRAY['Cargo Camera', 'Motion Detection', 'GPS'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '135 x 85 x 40 mm', 245, 'IP67', 225, true, true),
  ('Suntech', 'DeliveryCam HD', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12V', 3, 2, 1, ARRAY['Delivery Camera', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '110 x 70 x 28 mm', 155, 'IP65', 135, true, true),
  ('Suntech', 'TaxiCam Pro', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', true, '12V', 3, 2, 2, ARRAY['Taxi Camera', 'Passenger Safety', 'GPS'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '115 x 72 x 30 mm', 165, 'IP54', 155, true, true),
  ('Suntech', 'SchoolBus Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '24V', 5, 3, 2, ARRAY['School Bus Camera', 'Student Safety', 'GPS'], '-25°C to +75°C', ARRAY['CE', 'FCC'], '140 x 90 x 45 mm', 285, 'IP67', 245, true, true),
  ('Concox', 'MotoCam GPS', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '5m CEP', true, '12V', 2, 1, 1, ARRAY['Motorcycle Camera', 'GPS'], '-15°C to +65°C', ARRAY['CE'], '75 x 45 x 20 mm', 75, 'IP54', 55, true, true),
  ('Concox', 'PoliceCam 4G', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2m CEP', true, '12-24V', 4, 2, 2, ARRAY['Police Camera', 'Evidence Recording', 'GPS'], '-25°C to +75°C', ARRAY['CE'], '125 x 80 x 35 mm', 205, 'IP65', 185, true, true),
  ('Concox', 'RentalCar Cam', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '3m CEP', true, '12V', 3, 2, 1, ARRAY['Rental Camera', 'Usage Monitor', 'GPS'], '-20°C to +70°C', ARRAY['CE'], '112 x 68 x 28 mm', 145, 'IP54', 105, true, true)
) AS modelos(
  marca_nombre, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
) ON m.nombre = modelos.marca_nombre
WHERE NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = modelos.nombre AND marca_id = m.id);
