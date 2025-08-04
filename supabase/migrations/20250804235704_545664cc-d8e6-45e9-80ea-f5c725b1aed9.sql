-- Insertar modelos Queclink con especificaciones completas
-- Nota: Verificamos primero que la marca Queclink exista

-- GL530MG - LTE Waterproof Standby Asset Tracker
INSERT INTO modelos_gps (
  nombre, marca_id, tipo_dispositivo, protocolo_comunicacion, conectividad,
  gps_precision, bateria_interna, alimentacion_externa, entradas_digitales,
  salidas_digitales, entradas_analogicas, sensores_soportados,
  temperatura_operacion, certificaciones, dimensiones, peso_gramos,
  resistencia_agua, precio_referencia_usd, disponible_mexico, activo,
  especificaciones_json
) VALUES (
  'GL530MG',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83', -- Queclink ID
  'asset_tracker',
  ARRAY['LTE-M', 'NB-IoT', '2G'],
  ARRAY['4G LTE Cat-M1', 'NB-IoT', '2G'],
  '2.5m CEP',
  true,
  '9-36V DC',
  2,
  1,
  2,
  ARRAY['Accelerometer', 'Temperature', 'Light Sensor'],
  '-40°C to +85°C',
  ARRAY['CE', 'FCC', 'IC', 'RoHS', 'PTCRB'],
  '94 x 54 x 26 mm',
  150,
  'IP67',
  195,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS/Galileo/BDS",
      "precision": "2.5m CEP",
      "tiempo_cold_start": "35s",
      "tiempo_warm_start": "5s",
      "tiempo_hot_start": "1s",
      "sensibilidad": "-165 dBm"
    },
    "comunicacion": {
      "celular": "4G LTE Cat-M1/NB-IoT, 2G GSM",
      "bandas_lte": "B1/B2/B3/B4/B5/B8/B12/B13/B18/B19/B20/B26/B28",
      "bandas_gsm": "850/900/1800/1900 MHz"
    },
    "bateria": {
      "capacidad": "19000mAh Li-SOCL2",
      "vida_standby": "7 años",
      "reportes_diarios": "Hasta 2555 días"
    },
    "sensores": {
      "acelerometro": "3-axis",
      "temperatura": "Interno",
      "luz": "Sensor de luz ambiente"
    },
    "conectividad": {
      "bluetooth": "No",
      "wifi": "No",
      "interfaces": "Magnetic charging"
    }
  }'::jsonb
),

-- GV75MG - LTE Waterproof Advanced Vehicle Tracker
(
  'GV75MG',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'vehicle_tracker',
  ARRAY['LTE-M', 'NB-IoT', '2G', 'CAN'],
  ARRAY['4G LTE Cat-M1', 'NB-IoT', '2G'],
  '2.5m CEP',
  true,
  '9-36V DC',
  4,
  2,
  3,
  ARRAY['Accelerometer', 'Gyroscope', 'CAN Bus', 'OBD-II'],
  '-30°C to +70°C',
  ARRAY['CE', 'FCC', 'IC', 'RoHS', 'PTCRB'],
  '120 x 78 x 32 mm',
  220,
  'IP67',
  315,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS/Galileo/BDS",
      "precision": "2.5m CEP",
      "tiempo_cold_start": "30s",
      "sensibilidad": "-165 dBm"
    },
    "comunicacion": {
      "celular": "4G LTE Cat-M1/NB-IoT, 2G GSM",
      "bandas_lte": "B1/B2/B3/B4/B5/B8/B12/B13/B18/B19/B20/B26/B28",
      "can_bus": "Soporte CAN 2.0A/2.0B"
    },
    "alimentacion": {
      "voltaje_principal": "9-36V DC",
      "bateria_respaldo": "500mAh Li-ion",
      "consumo_standby": "Zero power mode"
    },
    "interfaces": {
      "rs232": "1 puerto",
      "digital_io": "4 entradas, 2 salidas",
      "analogicas": "3 entradas"
    }
  }'::jsonb
),

-- GL300N - 3G Asset Tracker
(
  'GL300N',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'asset_tracker',
  ARRAY['3G', '2G', 'SMS'],
  ARRAY['3G WCDMA', '2G GSM'],
  '2.5m CEP',
  true,
  'USB charging',
  1,
  0,
  0,
  ARRAY['Accelerometer', 'SOS Button'],
  '-20°C to +70°C',
  ARRAY['CE', 'FCC', 'IC'],
  '83 x 50 x 18 mm',
  85,
  'IP65',
  125,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS",
      "precision": "2.5m CEP",
      "tiempo_cold_start": "35s"
    },
    "comunicacion": {
      "celular": "3G WCDMA, 2G GSM",
      "bandas_3g": "B1/B5/B8",
      "bandas_gsm": "850/900/1800/1900 MHz"
    },
    "bateria": {
      "capacidad": "2600mAh Li-Polymer",
      "vida_standby": "480 horas",
      "carga": "USB"
    },
    "caracteristicas": {
      "boton_sos": "Si",
      "geo_cercas": "Si",
      "modo_ahorro": "Si"
    }
  }'::jsonb
),

-- GL300MA - Asset Tracker with Motion Detection
(
  'GL300MA',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'asset_tracker',
  ARRAY['3G', '2G', 'SMS'],
  ARRAY['3G WCDMA', '2G GSM'],
  '2.5m CEP',
  true,
  'USB charging',
  1,
  0,
  1,
  ARRAY['Accelerometer', 'Motion Detection', 'SOS Button'],
  '-20°C to +70°C',
  ARRAY['CE', 'FCC', 'IC'],
  '83 x 50 x 18 mm',
  85,
  'IP65',
  135,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS",
      "precision": "2.5m CEP",
      "tiempo_cold_start": "35s"
    },
    "comunicacion": {
      "celular": "3G WCDMA, 2G GSM",
      "bandas_3g": "B1/B5/B8",
      "bandas_gsm": "850/900/1800/1900 MHz"
    },
    "bateria": {
      "capacidad": "2600mAh Li-Polymer",
      "vida_standby": "480 horas",
      "carga": "USB"
    },
    "sensores": {
      "acelerometro": "3-axis",
      "deteccion_movimiento": "Avanzada",
      "boton_sos": "Si"
    }
  }'::jsonb
),

-- GL500 - Heavy Duty Vehicle Tracker
(
  'GL500',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'vehicle_tracker',
  ARRAY['3G', '2G', 'CAN', 'RS232'],
  ARRAY['3G WCDMA', '2G GSM'],
  '2.5m CEP',
  true,
  '9-36V DC',
  4,
  4,
  4,
  ARRAY['Accelerometer', 'Gyroscope', 'CAN Bus', 'OBD-II', 'Temperature'],
  '-30°C to +70°C',
  ARRAY['CE', 'FCC', 'IC', 'RoHS'],
  '140 x 95 x 45 mm',
  350,
  'IP67',
  285,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS/BDS",
      "precision": "2.5m CEP",
      "tiempo_cold_start": "30s"
    },
    "comunicacion": {
      "celular": "3G WCDMA, 2G GSM",
      "can_bus": "CAN 2.0A/2.0B",
      "rs232": "2 puertos"
    },
    "alimentacion": {
      "voltaje_principal": "9-36V DC",
      "bateria_respaldo": "1000mAh Li-ion",
      "consumo_standby": "8mA"
    },
    "interfaces": {
      "entradas_digitales": "4",
      "salidas_digitales": "4",
      "entradas_analogicas": "4",
      "rs232": "2 puertos"
    }
  }'::jsonb
),

-- GL300W - 3G Waterproof Asset Tracker
(
  'GL300W',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'asset_tracker',
  ARRAY['3G', '2G'],
  ARRAY['3G WCDMA', '2G GSM'],
  '2.5m CEP',
  true,
  'USB charging',
  1,
  0,
  0,
  ARRAY['Accelerometer', 'SOS Button'],
  '-20°C to +70°C',
  ARRAY['CE', 'FCC', 'IC'],
  '83 x 50 x 23 mm',
  95,
  'IP67',
  145,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS",
      "precision": "2.5m CEP"
    },
    "comunicacion": {
      "celular": "3G WCDMA, 2G GSM"
    },
    "bateria": {
      "capacidad": "2600mAh Li-Polymer",
      "vida_standby": "480 horas",
      "resistencia_agua": "IP67"
    }
  }'::jsonb
),

-- GV320MG - LTE Vehicle Tracker
(
  'GV320MG',
  '50dd8b40-239c-4ba7-abc9-280e620a3c83',
  'vehicle_tracker',
  ARRAY['LTE', '3G', '2G', 'CAN'],
  ARRAY['4G LTE', '3G WCDMA', '2G GSM'],
  '2.5m CEP',
  true,
  '9-36V DC',
  4,
  2,
  3,
  ARRAY['Accelerometer', 'Gyroscope', 'CAN Bus', 'OBD-II'],
  '-30°C to +70°C',
  ARRAY['CE', 'FCC', 'IC', 'RoHS', 'PTCRB'],
  '93 x 69 x 26 mm',
  180,
  'IP67',
  265,
  true,
  true,
  '{
    "gps": {
      "tipo": "GPS/GLONASS/BDS/Galileo",
      "precision": "2.5m CEP"
    },
    "comunicacion": {
      "celular": "4G LTE Cat-1, 3G WCDMA, 2G GSM",
      "can_bus": "CAN 2.0A/2.0B"
    },
    "alimentacion": {
      "voltaje_principal": "9-36V DC",
      "bateria_respaldo": "500mAh Li-ion"
    }
  }'::jsonb
);

-- Insertar configuraciones básicas para cada producto
INSERT INTO configuraciones_producto (producto_id, parametro, valor, descripcion, requerido)
SELECT p.id, 'server_ip', '0.0.0.0', 'Dirección IP del servidor de rastreo', true
FROM productos_inventario p 
WHERE p.modelo IN ('GL530MG', 'GV75MG', 'GL300N', 'GL300MA', 'GL500', 'GL300W', 'GV320MG')
ON CONFLICT DO NOTHING;

INSERT INTO configuraciones_producto (producto_id, parametro, valor, descripcion, requerido)
SELECT p.id, 'server_port', '8080', 'Puerto del servidor de rastreo', true
FROM productos_inventario p 
WHERE p.modelo IN ('GL530MG', 'GV75MG', 'GL300N', 'GL300MA', 'GL500', 'GL300W', 'GV320MG')
ON CONFLICT DO NOTHING;

INSERT INTO configuraciones_producto (producto_id, parametro, valor, descripcion, requerido)
SELECT p.id, 'apn', 'internet.itelcel.com', 'APN para México (Telcel)', true
FROM productos_inventario p 
WHERE p.modelo IN ('GL530MG', 'GV75MG', 'GL300N', 'GL300MA', 'GL500', 'GL300W', 'GV320MG')
ON CONFLICT DO NOTHING;