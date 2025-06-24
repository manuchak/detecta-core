
-- First, clear existing data to avoid duplicates
DELETE FROM modelos_gps;
DELETE FROM marcas_gps;

-- Insert GPS brands compatible with Wialon
INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) VALUES
('Teltonika', 'Lithuania', 'https://teltonika-gps.com', true, true),
('Aplicom', 'Finland', 'https://aplicom.com', true, true),
('Calamp', 'United States', 'https://calamp.com', true, true),
('Concox', 'China', 'https://concox.com', true, true),
('Meitrack', 'China', 'https://meitrack.com', true, true),
('Queclink', 'China', 'https://queclink.com', true, true),
('Ruptela', 'Lithuania', 'https://ruptela.com', true, true),
('Galileosky', 'Russia', 'https://galileosky.com', true, true),
('BCE', 'Lithuania', 'https://bce.lt', true, true),
('Bitrek', 'Ukraine', 'https://bitrek.ua', true, true),
('Coban', 'China', 'https://coban-gps.com', true, true),
('Enfora', 'United States', 'https://enfora.com', true, true),
('Globalsat', 'Taiwan', 'https://globalsat.com.tw', true, true),
('Gosafe', 'Taiwan', 'https://gosafe-tech.com', true, true),
('GT06', 'China', 'https://gt06.com', true, true),
('Howen', 'China', 'https://howen.com.cn', true, true),
('Lantronix', 'United States', 'https://lantronix.com', true, true),
('Maestro', 'Russia', 'https://m2m-tele.com', true, true),
('Navixy', 'Cyprus', 'https://navixy.com', true, true),
('Navtelecom', 'Russia', 'https://navtelecom.ru', true, true),
('Omnicomm', 'Russia', 'https://omnicomm.ru', true, true),
('Pretrollink', 'Ukraine', 'https://petrollink.ru', true, true),
('Sinotrack', 'China', 'https://sinotrack.com', true, true),
('Suntech', 'South Korea', 'https://suntech.com.tw', true, true),
('Topfly', 'China', 'https://topfly-tech.com', true, true),
('Wonde', 'China', 'https://wonde.com', true, true),
('Xirgo', 'United States', 'https://xirgo.com', true, true),
('Arnavi', 'Russia', 'https://arnavi.com', true, true),
('Autolink', 'Taiwan', 'https://autolink.com.tw', true, true),
('CalAmp LMU', 'United States', 'https://calamp.com/lmu', true, true),
('Castel', 'China', 'https://castel-gps.com', true, true),
('FM-Tec', 'Germany', 'https://fm-tec.de', true, true),
('Geolink', 'Brazil', 'https://geolink.com.br', true, true),
('Iridium', 'United States', 'https://iridium.com', true, true),
('Jointech', 'China', 'https://jointech.com', true, true),
('Kingneed', 'China', 'https://kingneed.com', true, true),
('Mobileye', 'Israel', 'https://mobileye.com', false, true),
('Otro', 'Personalizado', '', false, true);

-- Insert GPS models with detailed specifications
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad, 
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales, 
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion, 
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd, 
  disponible_mexico, activo
)
SELECT 
  m.id,
  modelos.nombre,
  modelos.tipo_dispositivo,
  modelos.protocolo_comunicacion,
  modelos.conectividad,
  modelos.gps_precision,
  modelos.bateria_interna,
  modelos.alimentacion_externa,
  modelos.entradas_digitales,
  modelos.salidas_digitales,
  modelos.entradas_analogicas,
  modelos.sensores_soportados,
  modelos.temperatura_operacion,
  modelos.certificaciones,
  modelos.dimensiones,
  modelos.peso_gramos,
  modelos.resistencia_agua,
  modelos.precio_referencia_usd,
  modelos.disponible_mexico,
  modelos.activo
FROM marcas_gps m
JOIN (VALUES
  -- TELTONIKA Models
  ('Teltonika', 'FMB920', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'Bluetooth'], '2.5m CEP', true, '9-30V', 4, 2, 2, ARRAY['Accelerometer', 'Gyroscope', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC'], '89 x 79 x 22 mm', 130, 'IP67', 89, true, true),
  ('Teltonika', 'FMB964', 'tracker', ARRAY['TCP', 'UDP', 'SMS', 'MQTT'], ARRAY['2G', '3G', '4G', 'Bluetooth', 'WiFi'], '2.5m CEP', true, '9-30V', 6, 4, 4, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC', 'PTCRB'], '89 x 79 x 22 mm', 145, 'IP67', 145, true, true),
  ('Teltonika', 'FMB130', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 3, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '79 x 65 x 19 mm', 80, 'IP67', 59, true, true),
  ('Teltonika', 'FMT100', 'personal_tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', 'WiFi'], '2.5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer', 'Temperature'], '-10°C to +55°C', ARRAY['CE', 'FCC'], '44 x 44 x 15 mm', 38, 'IP65', 45, true, true),
  ('Teltonika', 'FMB140', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '83 x 60 x 19 mm', 85, 'IP67', 69, true, true),
  ('Teltonika', 'FMB204', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 2, 1, 1, ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '66 x 46 x 16 mm', 65, 'IP67', 35, true, true),
  ('Teltonika', 'FMC130', 'can_tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '8-30V', 4, 2, 2, ARRAY['CAN', 'Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '83 x 60 x 19 mm', 90, 'IP67', 79, true, true),
  
  -- CALAMP Models
  ('Calamp', 'LMU-5530', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '3m CEP', false, '9-32V', 3, 2, 1, ARRAY['Accelerometer', 'Temperature'], '-30°C to +85°C', ARRAY['FCC', 'IC', 'PTCRB'], '110 x 64 x 34 mm', 180, 'IP65', 120, true, true),
  ('Calamp', 'LMU-4230', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', false, '8-32V', 4, 2, 2, ARRAY['Accelerometer'], '-30°C to +85°C', ARRAY['FCC', 'IC'], '100 x 60 x 30 mm', 150, 'IP54', 95, true, true),
  ('Calamp', 'TTU-2830', 'trailer_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, 'Batería', 2, 1, 1, ARRAY['Accelerometer', 'Temperature'], '-30°C to +70°C', ARRAY['FCC', 'IC'], '120 x 80 x 35 mm', 220, 'IP67', 160, true, true),
  
  -- QUECLINK Models
  ('Queclink', 'GV300W', 'tracker', ARRAY['TCP', 'UDP', 'HTTP'], ARRAY['2G', '3G', 'WiFi'], '2.5m CEP', true, '9-95V', 4, 2, 2, ARRAY['Accelerometer', 'Gyroscope', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC'], '83 x 67 x 24 mm', 115, 'IP67', 75, true, true),
  ('Queclink', 'GL300W', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'WiFi'], '5m CEP', true, 'USB', 1, 0, 0, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '64 x 43 x 17 mm', 50, 'IP65', 35, true, true),
  ('Queclink', 'GV500MA', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', true, '9-95V', 6, 3, 3, ARRAY['Accelerometer', 'Temperature', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '95 x 72 x 26 mm', 140, 'IP67', 89, true, true),
  
  -- CONCOX Models
  ('Concox', 'GT06N', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G'], '5m CEP', true, '9-36V', 2, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '64 x 46 x 17 mm', 50, 'IP65', 25, true, true),
  ('Concox', 'AT4', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', '4G'], '3m CEP', true, '9-36V', 3, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '95 x 56 x 25 mm', 90, 'IP67', 45, true, true),
  ('Concox', 'JM-VL01', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '40 x 35 x 15 mm', 30, 'IP54', 18, true, true),
  
  -- MEITRACK Models
  ('Meitrack', 'T366G', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', '4G'], '2.5m CEP', true, '9-95V', 6, 3, 3, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC'], '118 x 78 x 32 mm', 200, 'IP67', 135, true, true),
  ('Meitrack', 'MT90G', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, 'USB', 1, 0, 0, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '60 x 45 x 18 mm', 55, 'IP67', 42, true, true),
  
  -- APLICOM Models
  ('Aplicom', 'A12', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', '4G'], '2m CEP', true, '8-32V', 8, 4, 4, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'CAN', 'J1708'], '-40°C to +85°C', ARRAY['CE', 'FCC', 'IC', 'E-Mark'], '140 x 90 x 35 mm', 250, 'IP67', 185, true, true),
  ('Aplicom', 'A9', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', true, '8-32V', 6, 3, 2, ARRAY['Accelerometer', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '120 x 80 x 30 mm', 180, 'IP67', 155, true, true),
  
  -- SUNTECH Models
  ('Suntech', 'ST4340', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', '4G'], '3m CEP', false, '9-32V', 4, 2, 2, ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '105 x 68 x 28 mm', 140, 'IP65', 85, true, true),
  ('Suntech', 'ST4955', 'asset_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', true, 'Batería', 3, 1, 1, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '95 x 65 x 25 mm', 120, 'IP67', 98, true, true),
  
  -- GALILEOSKY Models
  ('Galileosky', 'v7.0', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G'], '3m CEP', true, '9-60V', 5, 3, 3, ARRAY['Accelerometer', 'Temperature', 'CAN'], '-40°C to +85°C', ARRAY['CE'], '120 x 85 x 30 mm', 170, 'IP54', 110, false, true),
  ('Galileosky', 'Base Block Eco', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-30V', 3, 2, 1, ARRAY['Accelerometer'], '-30°C to +70°C', ARRAY['CE'], '85 x 60 x 22 mm', 95, 'IP54', 65, false, true),
  
  -- COBAN Models
  ('Coban', 'TK103', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G'], '10m CEP', true, '12V', 1, 1, 0, ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '83 x 54 x 22 mm', 60, 'IP54', 20, true, true),
  ('Coban', 'TK306', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '10m CEP', true, 'USB', 0, 0, 0, ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '45 x 35 x 18 mm', 35, 'IP54', 15, true, true),
  
  -- RUPTELA Models
  ('Ruptela', 'HCV5', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G', 'CAN'], '2.5m CEP', true, '9-30V', 8, 4, 4, ARRAY['CAN', 'Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '130 x 85 x 32 mm', 200, 'IP67', 165, true, true),
  ('Ruptela', 'ECO4', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '3m CEP', true, '9-30V', 4, 2, 2, ARRAY['Accelerometer'], '-30°C to +85°C', ARRAY['CE'], '95 x 70 x 25 mm', 120, 'IP67', 89, true, true)
) AS modelos(
  marca_nombre, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
) ON m.nombre = modelos.marca_nombre;
