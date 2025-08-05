-- Agregar el modelo GPS GV310LAU de Queclink
INSERT INTO public.modelos_gps (
  marca_id,
  nombre,
  activo,
  tipo_dispositivo,
  protocolo_comunicacion,
  conectividad,
  gps_precision,
  bateria_interna,
  alimentacion_externa,
  entradas_digitales,
  salidas_digitales,
  entradas_analogicas,
  sensores_soportados,
  temperatura_operacion,
  certificaciones,
  dimensiones,
  peso_gramos,
  resistencia_agua,
  precio_referencia_usd,
  disponible_mexico,
  observaciones,
  especificaciones_json
) VALUES (
  '50dd8b40-239c-4ba7-abc9-280e620a3c83', -- ID de marca Queclink
  'GV310LAU',
  true,
  'Asset Tracker',
  ARRAY['TCP', 'UDP', 'SMS'],
  ARRAY['LTE Cat M1', 'NB-IoT', 'GSM'],
  '2.5m CEP',
  true,
  '6-60V DC',
  2,
  2,
  1,
  ARRAY['Temperature', 'Accelerometer', 'Light sensor', 'Motion detection'],
  '-40°C to +85°C',
  ARRAY['CE', 'FCC', 'IC', 'RCM'],
  '83.5 × 55.6 × 27.8 mm',
  85,
  'IP67',
  115.00,
  true,
  'Dispositivo de rastreo de activos con conectividad LTE Cat M1/NB-IoT. Ideal para seguimiento de vehículos, maquinaria y contenedores. Batería interna de larga duración.',
  '{
    "gnss": {
      "constellation": ["GPS", "GLONASS", "BeiDou", "Galileo"],
      "channels": 72,
      "cold_start": "29s",
      "hot_start": "1s"
    },
    "cellular": {
      "bands": {
        "lte_cat_m1": ["B1", "B2", "B3", "B4", "B5", "B8", "B12", "B13", "B18", "B19", "B20", "B25", "B26", "B28"],
        "nb_iot": ["B1", "B2", "B3", "B4", "B5", "B8", "B12", "B13", "B18", "B19", "B20", "B25", "B28"],
        "gsm": ["B2", "B3", "B5", "B8"]
      }
    },
    "battery": {
      "type": "Li-ion",
      "capacity": "6000mAh",
      "standby_time": "5 years"
    },
    "interfaces": {
      "digital_inputs": 2,
      "digital_outputs": 2,
      "analog_inputs": 1,
      "serial_ports": 0
    },
    "features": [
      "Jamming detection",
      "Towing detection", 
      "Crash detection",
      "Harsh driving detection",
      "Geofencing",
      "Over-the-air configuration",
      "Remote monitoring"
    ],
    "applications": [
      "Asset tracking",
      "Fleet management",
      "Equipment monitoring",
      "Container tracking",
      "Cargo security"
    ]
  }'::jsonb
);