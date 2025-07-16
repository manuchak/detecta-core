-- Enriquecimiento de base de datos GPS/Dashcam: Queclink y Suntech
-- Insertar marcas GPS si no existen
DO $$
DECLARE 
    queclink_id UUID;
    suntech_id UUID;
    existing_count INTEGER;
BEGIN
    -- Verificar e insertar Queclink
    SELECT COUNT(*) INTO existing_count FROM marcas_gps WHERE nombre = 'Queclink';
    IF existing_count = 0 THEN
        INSERT INTO marcas_gps (id, nombre, pais_origen, sitio_web, soporte_wialon, activo) 
        VALUES (gen_random_uuid(), 'Queclink', 'China', 'https://www.queclink.com', true, true);
    END IF;
    
    -- Verificar e insertar Suntech
    SELECT COUNT(*) INTO existing_count FROM marcas_gps WHERE nombre = 'Suntech';
    IF existing_count = 0 THEN
        INSERT INTO marcas_gps (id, nombre, pais_origen, sitio_web, soporte_wialon, activo) 
        VALUES (gen_random_uuid(), 'Suntech', 'Korea', 'https://suntechint.com', true, true);
    END IF;
    
    -- Obtener IDs de marcas
    SELECT id INTO queclink_id FROM marcas_gps WHERE nombre = 'Queclink';
    SELECT id INTO suntech_id FROM marcas_gps WHERE nombre = 'Suntech';
    
    -- Insertar modelos GPS de Queclink
    INSERT INTO modelos_gps (
        id, marca_id, nombre, tipo_dispositivo, dimensiones, peso_gramos, 
        precio_referencia_usd, conectividad, protocolo_comunicacion, 
        gps_precision, temperatura_operacion, alimentacion_externa, 
        bateria_interna, resistencia_agua, disponible_mexico, activo,
        entradas_digitales, salidas_digitales, sensores_soportados,
        certificaciones, observaciones
    ) VALUES 
    -- GV58LAU - LTE Cat 4 Mini GNSS Tracker
    (gen_random_uuid(), queclink_id, 'GV58LAU', 'Vehicle Tracker', 
     '90 x 50 x 18 mm', 85, 89.00, 
     ARRAY['LTE Cat 4', '3G', '2G', 'Bluetooth 5.2'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '2.5m CEP', '-40°C to +85°C', '9-90V DC', 
     true, 'IP67', true, true, 2, 2, 
     ARRAY['Accelerometer', 'Temperature', 'BLE Sensors'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'Compact design for covert installation. Supports BLE 5.2 accessories.'),
     
    -- GV300 - Best-seller Advanced Vehicle Tracker
    (gen_random_uuid(), queclink_id, 'GV300', 'Vehicle Tracker', 
     '125 x 90 x 28 mm', 180, 95.00, 
     ARRAY['GSM', 'GPRS'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '2.5m CEP', '-30°C to +70°C', '9-90V DC', 
     true, 'IP65', true, true, 4, 2, 
     ARRAY['Accelerometer', 'Temperature', 'CAN', 'RS232'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'Third generation vehicle tracker. Best-seller worldwide. Multiple interfaces.'),
     
    -- GV300W - WCDMA/GSM Advanced Vehicle Tracker
    (gen_random_uuid(), queclink_id, 'GV300W', 'Vehicle Tracker', 
     '125 x 90 x 28 mm', 180, 105.00, 
     ARRAY['WCDMA', 'GSM'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '2.5m CEP', '-30°C to +70°C', '9-90V DC', 
     true, 'IP65', true, true, 4, 2, 
     ARRAY['Accelerometer', 'Temperature', 'CAN', 'RS232'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'WCDMA version of GV300. Ideal for fleet management and cold chain logistics.'),
     
    -- GV53MG - LTE Cat M1/NB2 Compact Tracker
    (gen_random_uuid(), queclink_id, 'GV53MG', 'Asset Tracker', 
     '85 x 45 x 15 mm', 65, 75.00, 
     ARRAY['LTE Cat M1', 'NB-IoT'], 
     ARRAY['TCP', 'UDP', 'CoAP'], 
     '2.5m CEP', '-40°C to +85°C', '9-90V DC', 
     true, 'IP67', true, true, 2, 1, 
     ARRAY['Accelerometer', 'Temperature'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'Ultra-thin design. AES-256 encryption. Low power consumption.'),
     
    -- CV200 - AI-Powered LTE Cat 6 Dash Camera
    (gen_random_uuid(), queclink_id, 'CV200', 'Dashcam', 
     '110 x 65 x 35 mm', 280, 350.00, 
     ARRAY['LTE Cat 6', '4G', '3G', '2G', 'WiFi'], 
     ARRAY['TCP', 'UDP', 'FTP', 'HTTP'], 
     '2.5m CEP', '-20°C to +70°C', '12V DC', 
     false, 'IP54', true, true, 4, 2, 
     ARRAY['ADAS', 'DMS', 'Accelerometer', 'Gyroscope', 'Dual Camera'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'AI-powered dash camera with ADAS/DMS. Dual camera support. 1080P recording.');
     
    -- Insertar modelos GPS de Suntech
    INSERT INTO modelos_gps (
        id, marca_id, nombre, tipo_dispositivo, dimensiones, peso_gramos, 
        precio_referencia_usd, conectividad, protocolo_comunicacion, 
        gps_precision, temperatura_operacion, alimentacion_externa, 
        bateria_interna, resistencia_agua, disponible_mexico, activo,
        entradas_digitales, salidas_digitales, sensores_soportados,
        certificaciones, observaciones
    ) VALUES 
    -- ST340 - Compact 2G Vehicle Tracker
    (gen_random_uuid(), suntech_id, 'ST340', 'Vehicle Tracker', 
     '83 x 54 x 22 mm', 90, 65.00, 
     ARRAY['GSM', 'GPRS'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '3m CEP', '-25°C to +70°C', '8-32V DC', 
     true, 'IP65', true, true, 3, 1, 
     ARRAY['Accelerometer', 'Temperature'], 
     ARRAY['CE', 'FCC'], 
     'Compact design for motorcycles, boats, and heavy machinery. Easy installation.'),
     
    -- ST340LC - Enhanced 2G Vehicle Tracker
    (gen_random_uuid(), suntech_id, 'ST340LC', 'Vehicle Tracker', 
     '83 x 54 x 22 mm', 95, 72.00, 
     ARRAY['GSM', 'GPRS'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '3m CEP', '-25°C to +70°C', '8-32V DC', 
     true, 'IP65', true, true, 4, 2, 
     ARRAY['Accelerometer', 'Temperature', 'Fuel Sensor'], 
     ARRAY['CE', 'FCC'], 
     'Enhanced version of ST340 with additional I/O ports and fuel monitoring.'),
     
    -- ST4305 - 4G LTE Advanced Vehicle Tracker
    (gen_random_uuid(), suntech_id, 'ST4305', 'Vehicle Tracker', 
     '110 x 70 x 25 mm', 150, 120.00, 
     ARRAY['4G LTE', '3G', '2G'], 
     ARRAY['TCP', 'UDP', 'SMS'], 
     '2.5m CEP', '-30°C to +70°C', '9-90V DC', 
     true, 'IP67', true, true, 4, 2, 
     ARRAY['Accelerometer', 'GLONASS', 'ADC', 'Digital Sensors'], 
     ARRAY['CE', 'FCC', 'IC'], 
     '4G LTE connectivity with blackbox feature. ECO driving support.'),
     
    -- ST4315U - Low Cost 4G LTE Tracker
    (gen_random_uuid(), suntech_id, 'ST4315U', 'Vehicle Tracker', 
     '95 x 60 x 20 mm', 120, 85.00, 
     ARRAY['4G LTE', '3G'], 
     ARRAY['TCP', 'UDP'], 
     '2.5m CEP', '-30°C to +70°C', '9-32V DC', 
     true, 'IP65', true, true, 2, 1, 
     ARRAY['Accelerometer', 'Temperature'], 
     ARRAY['CE', 'FCC'], 
     'Low cost 4G LTE solution. Great for fleet tracking and asset monitoring.'),
     
    -- ST4955 - Premium 4G Vehicle Tracker
    (gen_random_uuid(), suntech_id, 'ST4955', 'Vehicle Tracker', 
     '120 x 80 x 30 mm', 200, 145.00, 
     ARRAY['4G LTE', '3G', '2G', 'WiFi'], 
     ARRAY['TCP', 'UDP', 'SMS', 'HTTP'], 
     '2.5m CEP', '-30°C to +70°C', '9-90V DC', 
     true, 'IP67', true, true, 6, 4, 
     ARRAY['Accelerometer', 'Gyroscope', 'CAN', 'RS232', 'OBD'], 
     ARRAY['CE', 'FCC', 'IC'], 
     'Premium model with advanced connectivity and multiple I/O ports. OBD support.');
     
END $$;