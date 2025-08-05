-- Enriquecer base de datos de modelos GPS con tipos de dispositivos más específicos
-- Actualizar y normalizar tipos de dispositivos existentes

-- Normalizar tipos de dispositivos para dashcams
UPDATE modelos_gps 
SET tipo_dispositivo = 'dashcam'
WHERE tipo_dispositivo IN ('Dashcam', 'dashcam') OR nombre ILIKE '%cam%' OR nombre ILIKE '%jc261%' OR nombre ILIKE '%jc450%';

-- Normalizar tipos de dispositivos para trackers vehiculares
UPDATE modelos_gps 
SET tipo_dispositivo = 'vehicle_tracker'
WHERE tipo_dispositivo IN ('Vehicle Tracker', 'tracker', 'fleet_tracker') AND tipo_dispositivo != 'dashcam';

-- Agregar nuevos modelos GPS populares en el mercado mexicano
INSERT INTO modelos_gps (marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad, gps_precision, bateria_interna, alimentacion_externa, entradas_digitales, salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion, certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd, disponible_mexico, observaciones, especificaciones_json, activo) VALUES

-- Jimi IoT - Cámaras dashcam
((SELECT id FROM marcas_gps WHERE nombre = 'Jimi IoT'), 'JC400', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '2.5m CEP', false, '12-24V DC', 2, 1, 1, ARRAY['HD Camera', 'GPS', 'G-Sensor', 'Fatigue Detection'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '110x75x35mm', 200, 'IP65', 180.00, true, 'Cámara dashcam con detección de fatiga', '{"tipo_dispositivo": "dashcam", "resolucion_video": "1080p", "almacenamiento": "microSD", "cloud_storage": true}', true),

((SELECT id FROM marcas_gps WHERE nombre = 'Jimi IoT'), 'JC200', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['3G', '4G'], '2.5m CEP', true, '12-24V DC', 2, 1, 1, ARRAY['Dual Camera', 'GPS', 'G-Sensor', 'Live Streaming'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '120x80x40mm', 250, 'IP67', 220.00, true, 'Dashcam con cámara dual y transmisión en vivo', '{"tipo_dispositivo": "dashcam", "resolucion_video": "1080p", "dual_camera": true, "live_streaming": true}', true),

-- Queclink - Trackers vehiculares premium
((SELECT id FROM marcas_gps WHERE nombre = 'Queclink'), 'GV500MA', 'vehicle_tracker', ARRAY['TCP', 'UDP'], ARRAY['4G', 'LTE'], '1.5m CEP', true, '9-36V DC', 4, 2, 2, ARRAY['Accelerometer', 'Gyroscope', 'Temperature', 'CAN Bus'], '-30°C to +70°C', ARRAY['CE', 'FCC', 'PTCRB'], '93x54x26mm', 180, 'IP67', 150.00, true, 'Tracker vehicular avanzado con CAN Bus', '{"tipo_dispositivo": "vehicle_tracker", "can_bus": true, "advanced_analytics": true}', true),

((SELECT id FROM marcas_gps WHERE nombre = 'Queclink'), 'GV75W', 'vehicle_tracker', ARRAY['TCP', 'UDP'], ARRAY['4G', 'WiFi'], '1.5m CEP', true, '9-36V DC', 3, 2, 1, ARRAY['WiFi', 'BLE', 'Accelerometer'], '-30°C to +70°C', ARRAY['CE', 'FCC'], '85x52x24mm', 160, 'IP67', 130.00, true, 'Tracker con conectividad WiFi para flotas', '{"tipo_dispositivo": "vehicle_tracker", "wifi_enabled": true, "bluetooth": true}', true),

-- Teltonika - Trackers profesionales
((SELECT id FROM marcas_gps WHERE nombre = 'Teltonika'), 'FMB964', 'vehicle_tracker', ARRAY['TCP', 'UDP'], ARRAY['4G', 'LTE-M'], '1.5m CEP', true, '8-30V DC', 4, 2, 2, ARRAY['Accelerometer', 'Gyroscope', 'GNSS', 'BLE', 'CAN'], '-40°C to +85°C', ARRAY['CE', 'E-mark', 'RCM'], '88x68x23mm', 150, 'IP67', 180.00, true, 'Tracker premium con múltiples conectividades', '{"tipo_dispositivo": "vehicle_tracker", "gnss_assisted": true, "ble_beacons": true}', true),

((SELECT id FROM marcas_gps WHERE nombre = 'Teltonika'), 'FMP100', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['LTE-M', 'NB-IoT'], '2.5m CEP', true, 'Batería Li-Ion', 0, 0, 0, ARRAY['Accelerometer', 'GPS', 'SOS Button'], '-20°C to +60°C', ARRAY['CE', 'FCC'], '51x51x17mm', 45, 'IP67', 85.00, true, 'Tracker personal compacto', '{"tipo_dispositivo": "personal_tracker", "sos_button": true, "compact_design": true}', true),

-- Concox - Dashcams económicas
((SELECT id FROM marcas_gps WHERE nombre = 'Concox'), 'HVT001', 'dashcam', ARRAY['TCP', 'UDP'], ARRAY['4G'], '2.5m CEP', false, '12-24V DC', 2, 1, 1, ARRAY['HD Camera', 'GPS', 'G-Sensor'], '-20°C to +65°C', ARRAY['CE'], '105x70x30mm', 180, 'IP65', 95.00, true, 'Dashcam económica para flotas', '{"tipo_dispositivo": "dashcam", "resolucion_video": "720p", "basic_features": true}', true),

-- Meitrack - Trackers versátiles
((SELECT id FROM marcas_gps WHERE nombre = 'Meitrack'), 'T366', 'vehicle_tracker', ARRAY['TCP', 'UDP'], ARRAY['4G', 'LTE'], '1.5m CEP', true, '9-95V DC', 4, 2, 2, ARRAY['Accelerometer', 'Temperature', 'CAN', 'RS232'], '-25°C to +70°C', ARRAY['CE', 'FCC'], '96x55x26mm', 200, 'IP67', 140.00, true, 'Tracker resistente para vehículos pesados', '{"tipo_dispositivo": "vehicle_tracker", "heavy_duty": true, "wide_voltage": true}', true);

-- Actualizar especificaciones JSON para dispositivos existentes que no las tengan
UPDATE modelos_gps 
SET especificaciones_json = CASE 
  WHEN tipo_dispositivo = 'dashcam' THEN 
    '{"tipo_dispositivo": "dashcam", "camera_enabled": true, "video_recording": true}'::jsonb
  WHEN tipo_dispositivo = 'vehicle_tracker' THEN 
    '{"tipo_dispositivo": "vehicle_tracker", "vehicle_optimized": true}'::jsonb
  WHEN tipo_dispositivo = 'personal_tracker' THEN 
    '{"tipo_dispositivo": "personal_tracker", "compact_size": true}'::jsonb
  WHEN tipo_dispositivo = 'asset_tracker' THEN 
    '{"tipo_dispositivo": "asset_tracker", "asset_monitoring": true}'::jsonb
  ELSE 
    '{"tipo_dispositivo": "generic_tracker"}'::jsonb
END
WHERE especificaciones_json IS NULL OR especificaciones_json = '{}';

-- Crear índice para optimizar búsquedas por tipo de dispositivo
CREATE INDEX IF NOT EXISTS idx_modelos_gps_tipo_dispositivo ON modelos_gps(tipo_dispositivo);
CREATE INDEX IF NOT EXISTS idx_modelos_gps_especificaciones ON modelos_gps USING GIN(especificaciones_json);

-- Agregar comentarios a la tabla para documentación
COMMENT ON COLUMN modelos_gps.tipo_dispositivo IS 'Tipo de dispositivo: dashcam, vehicle_tracker, personal_tracker, asset_tracker, etc.';
COMMENT ON COLUMN modelos_gps.especificaciones_json IS 'Especificaciones técnicas detalladas en formato JSON para búsquedas avanzadas';