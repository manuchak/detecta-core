-- =====================================================
-- Migration: Fix Data Types and Create vw_servicios_facturacion_v2
-- Purpose: Convert DATE columns to TIMESTAMPTZ and create comprehensive view
-- Must drop dependent view first
-- =====================================================

-- Step 1: Drop the existing view that depends on these columns
DROP VIEW IF EXISTS vw_servicios_facturacion CASCADE;

-- Step 2: Convert DATE columns to TIMESTAMPTZ to preserve time component
ALTER TABLE servicios_custodia 
  ALTER COLUMN hora_presentacion TYPE timestamptz USING hora_presentacion::timestamptz,
  ALTER COLUMN hora_inicio_custodia TYPE timestamptz USING hora_inicio_custodia::timestamptz,
  ALTER COLUMN hora_arribo TYPE timestamptz USING hora_arribo::timestamptz,
  ALTER COLUMN hora_finalizacion TYPE timestamptz USING hora_finalizacion::timestamptz,
  ALTER COLUMN fecha_hora_asignacion TYPE timestamptz USING fecha_hora_asignacion::timestamptz;

-- Step 3: Convert created_at from TEXT to TIMESTAMPTZ
ALTER TABLE servicios_custodia 
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;

-- Step 4: Create the new comprehensive view (replacing old one)
CREATE OR REPLACE VIEW vw_servicios_facturacion AS
SELECT 
  -- IDENTIFICACION (sin truncar)
  sc.id,
  sc.id_servicio AS folio_saphiro,
  sc.id_servicio,                              -- Keep for backward compatibility
  sp.id_servicio AS folio_planeacion,
  sc.folio_cliente,
  sp.id_interno_cliente AS referencia_cliente,
  sp.id_interno_cliente,                       -- Keep for backward compatibility
  
  -- TIMELINE PLANEACION
  sp.created_at AS fecha_recepcion,
  sp.fecha_asignacion,
  sp.fecha_asignacion_armado,
  
  -- TIMELINE OPERATIVO (FECHA ANCLA)
  sc.fecha_hora_cita,
  sc.fecha_hora_asignacion,
  sc.hora_presentacion,
  sc.hora_inicio_custodia,
  sc.hora_arribo,
  sc.hora_finalizacion,
  
  -- DURACION
  sc.duracion_servicio,
  CASE 
    WHEN sc.hora_inicio_custodia IS NOT NULL AND sc.hora_finalizacion IS NOT NULL 
    THEN sc.hora_finalizacion - sc.hora_inicio_custodia
    ELSE NULL 
  END AS duracion_calculada,
  sc.tiempo_retraso,
  
  -- CLIENTE
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  
  -- RUTA Y UBICACION
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  
  -- KILOMETRAJE
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 
    THEN ROUND(((sc.km_recorridos - sc.km_teorico)::numeric / sc.km_teorico::numeric * 100), 1)
    ELSE NULL 
  END AS desviacion_km,
  
  -- CUSTODIO (desde planeacion + ejecucion)
  COALESCE(sp.custodio_asignado, sc.nombre_custodio) AS nombre_custodio,
  sp.custodio_id,
  sc.telefono AS telefono_custodio,
  sc.auto AS vehiculo_custodio,
  sc.placa AS placa_custodio,
  
  -- ARMADO (desde planeacion + ejecucion)
  COALESCE(sp.armado_asignado, sc.nombre_armado) AS nombre_armado,
  sp.armado_id,
  sc.telefono_armado,
  sp.tipo_asignacion_armado,
  sc.proveedor,
  COALESCE(sp.requiere_armado, sc.requiere_armado) AS requiere_armado,
  
  -- TRANSPORTE (desde ejecucion)
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.telefono_operador,
  sc.placa_carga,
  
  -- TRACKING
  sc.gadget,
  sc.tipo_gadget,
  
  -- FINANCIERO
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente) AS cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) AS margen_bruto,
  CASE 
    WHEN COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) > 0 
    THEN ROUND(((COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) 
         / COALESCE(sp.tarifa_acordada, sc.cobro_cliente))::numeric * 100, 1)
    ELSE 0 
  END AS porcentaje_margen,
  
  -- ESTADO
  sc.estado,
  sp.estado_planeacion,
  sc.tipo_servicio,
  
  -- METADATA
  sc.creado_via,
  sc.creado_por,
  sc.created_at,
  sc.updated_time

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp 
  ON sc.id_servicio = sp.id_servicio::text;