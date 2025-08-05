-- Agregar campos de pretensiones económicas a la tabla instaladores
ALTER TABLE instaladores 
ADD COLUMN IF NOT EXISTS tarifa_instalacion_basica NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_gps_vehicular NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_gps_personal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_camara_seguridad NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_sensor_combustible NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_boton_panico NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_sensor_temperatura NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_instalacion_compleja NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_mantenimiento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tarifa_kilometraje NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS acepta_pagos_efectivo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_pagos_transferencia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS acepta_pagos_cheque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requiere_anticipo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentaje_anticipo NUMERIC DEFAULT 0;