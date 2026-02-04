-- Drop and recreate view with corrected data sources
DROP VIEW IF EXISTS vw_servicios_facturacion;

CREATE VIEW vw_servicios_facturacion AS
SELECT 
  sc.id,
  sc.id_servicio AS folio_saphiro,
  sc.id_servicio,
  sp.id_servicio AS folio_planeacion,
  sc.folio_cliente,
  sp.id_interno_cliente AS referencia_cliente,
  sp.id_interno_cliente,
  
  -- Timeline Planeacion
  sp.created_at AS fecha_recepcion,
  sp.fecha_asignacion,
  sp.fecha_asignacion_armado,
  
  -- Timeline Operativo
  sc.fecha_hora_cita,
  sc.fecha_hora_asignacion,
  
  -- PRESENTACION: Combinar fecha_cita + hora_llegada_custodio de planeacion
  CASE 
    WHEN sp.hora_llegada_custodio IS NOT NULL 
    THEN (sp.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamptz
    ELSE NULL
  END AS hora_presentacion,
  
  -- INICIO: Preferir hora_inicio_real de planeacion (89% cobertura)
  sp.hora_inicio_real AS hora_inicio_custodia,
  
  -- ARRIBO: De servicios_custodia (punto destino)
  -- Solo usar si tiene hora real (no 00:00)
  CASE 
    WHEN sc.hora_arribo IS NOT NULL AND EXTRACT(HOUR FROM sc.hora_arribo) != 0
    THEN sc.hora_arribo
    ELSE NULL
  END AS hora_arribo,
  
  -- FIN: Usar hora_fin_real de planeacion
  sp.hora_fin_real AS hora_finalizacion,
  
  -- Duracion original
  sc.duracion_servicio,
  
  -- DURACION CALCULADA: Solo si tenemos inicio Y fin reales
  CASE 
    WHEN sp.hora_inicio_real IS NOT NULL AND sp.hora_fin_real IS NOT NULL
    THEN sp.hora_fin_real - sp.hora_inicio_real
    ELSE NULL
  END AS duracion_calculada,
  
  -- RETRASO CALCULADO: inicio real - hora cita
  CASE 
    WHEN sp.hora_inicio_real IS NOT NULL AND sp.fecha_hora_cita IS NOT NULL
    THEN sp.hora_inicio_real - sp.fecha_hora_cita
    ELSE sc.tiempo_retraso
  END AS tiempo_retraso,
  
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 
    THEN ROUND(((sc.km_recorridos - sc.km_teorico) / sc.km_teorico * 100)::numeric, 1)
    ELSE NULL 
  END AS desviacion_km,
  
  -- CUSTODIO: Datos de planeacion
  COALESCE(sp.custodio_asignado, sc.nombre_custodio) AS nombre_custodio,
  sp.custodio_id,
  sc.telefono AS telefono_custodio,
  sc.auto AS vehiculo_custodio,
  sc.placa AS placa_custodio,
  
  -- ARMADO: Todo desde planeacion
  sp.armado_asignado AS nombre_armado,
  sp.armado_id,
  sc.telefono_armado,
  sp.tipo_asignacion_armado,
  
  -- PROVEEDOR: Si tipo_asignacion = 'proveedor', buscar nombre de proveedor
  CASE 
    WHEN sp.tipo_asignacion_armado = 'proveedor' AND sp.proveedor_armado_id IS NOT NULL
    THEN pa.nombre_empresa
    ELSE NULL
  END AS proveedor,
  
  COALESCE(sp.requiere_armado, sc.requiere_armado) AS requiere_armado,
  
  -- Transporte (de servicios_custodia)
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.telefono_operador,
  sc.placa_carga,
  sc.gadget,
  sc.tipo_gadget,
  
  -- Financiero
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente) AS cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) AS margen_bruto,
  CASE 
    WHEN COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) > 0 
    THEN ROUND(
      (COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) 
      / COALESCE(sp.tarifa_acordada, sc.cobro_cliente) * 100, 1
    )
    ELSE 0 
  END AS porcentaje_margen,
  
  sc.estado,
  sp.estado_planeacion,
  sc.tipo_servicio,
  sc.creado_via,
  sc.creado_por,
  sc.created_at,
  sc.updated_time

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp ON sc.id_servicio = sp.id_servicio
LEFT JOIN proveedores_armados pa ON sp.proveedor_armado_id = pa.id;