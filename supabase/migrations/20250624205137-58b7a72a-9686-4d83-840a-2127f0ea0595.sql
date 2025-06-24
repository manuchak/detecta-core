
-- Migración para agregar más modelos GPS sin conflictos
-- Solo insertamos nuevas marcas que no existan
INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Telematika', 'Russia', 'https://telematika.ru', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Telematika');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Orion', 'Russia', 'https://orion-tech.ru', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Orion');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Naviset', 'Russia', 'https://naviset.ru', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Naviset');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Starcom', 'Russia', 'https://starcom.ru', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Starcom');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Escort', 'Russia', 'https://escort-rus.ru', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Escort');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Jimi IoT', 'China', 'https://www.jimilab.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Jimi IoT');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Fifotrack', 'China', 'https://www.fifotrack.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Fifotrack');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Topten', 'China', 'https://www.toptentrack.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Topten');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'TK Star', 'China', 'https://www.tkstargps.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'TK Star');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Seeworld', 'China', 'https://www.seeworld.com.cn', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Seeworld');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Atrack', 'Taiwan', 'https://www.atrack.com.tw', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Atrack');

INSERT INTO marcas_gps (nombre, pais_origen, sitio_web, soporte_wialon, activo) 
SELECT 'Eelink', 'China', 'https://www.eelink.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM marcas_gps WHERE nombre = 'Eelink');

-- Ahora insertamos modelos adicionales populares de Teltonika (marca líder)
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB001', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '3m CEP', true, '8-30V', 2, 1, 1,
  ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '56 x 39 x 15 mm', 45, 'IP67', 39, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB001' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB010', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 3, 2, 1,
  ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '66 x 46 x 16 mm', 55, 'IP67', 45, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB010' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB020', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 4, 2, 2,
  ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '83 x 60 x 19 mm', 75, 'IP67', 52, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB020' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB125', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 3, 2, 2,
  ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '79 x 65 x 19 mm', 80, 'IP67', 58, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB125' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB202', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'Bluetooth'], '2.5m CEP', true, '8-30V', 2, 1, 1,
  ARRAY['Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '66 x 46 x 16 mm', 60, 'IP67', 42, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB202' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMB640', 'tracker', ARRAY['TCP', 'UDP', 'SMS'], ARRAY['2G', '3G', 'Bluetooth'], '2.5m CEP', true, '9-30V', 4, 2, 2,
  ARRAY['Accelerometer', 'Temperature'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '89 x 79 x 22 mm', 125, 'IP67', 75, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMB640' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMC001', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'CAN'], '2.5m CEP', true, '8-30V', 2, 1, 1,
  ARRAY['CAN'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '56 x 39 x 15 mm', 50, 'IP67', 48, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMC001' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'FMC125', 'can_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'CAN'], '2.5m CEP', true, '8-30V', 4, 2, 2,
  ARRAY['CAN', 'Accelerometer'], '-40°C to +85°C', ARRAY['CE', 'FCC'], '79 x 65 x 19 mm', 85, 'IP67', 72, true, true
FROM marcas_gps m WHERE m.nombre = 'Teltonika'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'FMC125' AND marca_id = m.id);

-- Modelos adicionales de Queclink
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'GV55', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '2.5m CEP', false, '9-30V', 2, 1, 1,
  ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '85 x 60 x 22 mm', 85, 'IP65', 45, true, true
FROM marcas_gps m WHERE m.nombre = 'Queclink'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'GV55' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'GV65', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', '3G'], '2.5m CEP', false, '9-30V', 3, 2, 2,
  ARRAY['Accelerometer', 'Temperature'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '90 x 65 x 25 mm', 95, 'IP65', 52, true, true
FROM marcas_gps m WHERE m.nombre = 'Queclink'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'GV65' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'GV200', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '3m CEP', false, '9-30V', 3, 2, 1,
  ARRAY['Accelerometer'], '-30°C to +80°C', ARRAY['CE', 'FCC'], '85 x 60 x 22 mm', 90, 'IP65', 48, true, true
FROM marcas_gps m WHERE m.nombre = 'Queclink'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'GV200' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'GL200', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 1, 0, 0,
  ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE', 'FCC'], '64 x 43 x 17 mm', 45, 'IP65', 32, true, true
FROM marcas_gps m WHERE m.nombre = 'Queclink'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'GL200' AND marca_id = m.id);

-- Modelos adicionales de Concox
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'AT1', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1,
  ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '85 x 50 x 22 mm', 65, 'IP65', 22, true, true
FROM marcas_gps m WHERE m.nombre = 'Concox'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'AT1' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'AT2', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-36V', 3, 2, 2,
  ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '90 x 55 x 24 mm', 75, 'IP65', 28, true, true
FROM marcas_gps m WHERE m.nombre = 'Concox'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'AT2' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'OB22', 'obd_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G', 'OBD'], '5m CEP', false, 'OBD-II', 0, 0, 0,
  ARRAY['OBD', 'Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '65 x 45 x 25 mm', 45, 'IP54', 25, true, true
FROM marcas_gps m WHERE m.nombre = 'Concox'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'OB22' AND marca_id = m.id);

-- Modelos de Jimi IoT (nuevos)
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'JM01', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1,
  ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '85 x 55 x 22 mm', 70, 'IP65', 35, true, true
FROM marcas_gps m WHERE m.nombre = 'Jimi IoT'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'JM01' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'VL01E', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0,
  ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '40 x 35 x 15 mm', 30, 'IP54', 18, true, true
FROM marcas_gps m WHERE m.nombre = 'Jimi IoT'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'VL01E' AND marca_id = m.id);

-- Modelos de Fifotrack (nuevos)
INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'A100', 'tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', false, '9-36V', 2, 1, 1,
  ARRAY['Accelerometer'], '-20°C to +70°C', ARRAY['CE'], '85 x 55 x 22 mm', 68, 'IP65', 28, true, true
FROM marcas_gps m WHERE m.nombre = 'Fifotrack'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'A100' AND marca_id = m.id);

INSERT INTO modelos_gps (
  marca_id, nombre, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados, temperatura_operacion,
  certificaciones, dimensiones, peso_gramos, resistencia_agua, precio_referencia_usd,
  disponible_mexico, activo
)
SELECT 
  m.id, 'S50', 'personal_tracker', ARRAY['TCP', 'UDP'], ARRAY['2G'], '5m CEP', true, 'USB', 0, 0, 0,
  ARRAY['Accelerometer'], '-10°C to +60°C', ARRAY['CE'], '45 x 35 x 15 mm', 32, 'IP54', 19, true, true
FROM marcas_gps m WHERE m.nombre = 'Fifotrack'
AND NOT EXISTS (SELECT 1 FROM modelos_gps WHERE nombre = 'S50' AND marca_id = m.id);
