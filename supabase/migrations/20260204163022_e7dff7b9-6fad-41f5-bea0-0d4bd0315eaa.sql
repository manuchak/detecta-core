-- Update vw_servicios_facturacion to include all BI fields and timeline data
-- Includes JOIN to servicios_planificados for id_interno_cliente

DROP VIEW IF EXISTS vw_servicios_facturacion;

CREATE OR REPLACE VIEW vw_servicios_facturacion AS
SELECT 
  -- Identificación
  sc.id,
  sc.id_servicio,
  sc.folio_cliente,
  sp.id_interno_cliente,  -- Folio interno del cliente desde servicios_planificados
  
  -- Tiempos del journey completo
  sc.fecha_hora_cita,
  sc.fecha_hora_asignacion,
  sc.hora_presentacion,
  sc.hora_inicio_custodia,
  sc.hora_arribo,
  sc.hora_finalizacion,
  sc.duracion_servicio,
  sc.tiempo_retraso,
  sc.created_at,
  sc.updated_time,
  
  -- Cliente
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  
  -- Ruta
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  
  -- Kilometraje
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 THEN 
      ROUND(((COALESCE(sc.km_recorridos, 0) - sc.km_teorico) / sc.km_teorico * 100)::numeric, 1)
    ELSE NULL 
  END as desviacion_km,
  
  -- Recursos
  sc.nombre_custodio,
  sc.telefono as telefono_custodio,
  sc.nombre_armado,
  sc.telefono_armado,
  sc.proveedor,
  sc.requiere_armado,
  
  -- Transporte
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.placa_carga,
  
  -- Tracking
  sc.gadget,
  sc.tipo_gadget,
  
  -- Financiero
  sc.cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) as margen_bruto,
  CASE 
    WHEN COALESCE(sc.cobro_cliente, 0) > 0 THEN 
      ROUND((COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) / sc.cobro_cliente * 100, 1)
    ELSE 0 
  END as porcentaje_margen,
  
  -- Estado y tipo
  sc.estado,
  sc.tipo_servicio,
  sc.estado_planeacion,
  
  -- Origen del registro
  sc.creado_via,
  sc.creado_por

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp ON sc.id_servicio = sp.id_servicio;