-- Eliminar vista dependiente
DROP VIEW IF EXISTS vw_servicios_facturacion;

-- Convertir campos DATE a TIMESTAMPTZ en servicios_custodia
ALTER TABLE servicios_custodia 
  ALTER COLUMN hora_presentacion TYPE timestamptz USING hora_presentacion::timestamptz,
  ALTER COLUMN hora_inicio_custodia TYPE timestamptz USING hora_inicio_custodia::timestamptz,
  ALTER COLUMN hora_arribo TYPE timestamptz USING hora_arribo::timestamptz,
  ALTER COLUMN hora_finalizacion TYPE timestamptz USING hora_finalizacion::timestamptz,
  ALTER COLUMN fecha_hora_asignacion TYPE timestamptz USING fecha_hora_asignacion::timestamptz;

-- Recrear vista con fuentes de timestamp corregidas
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
  
  -- Presentacion: combinar fecha con hora si existe
  CASE 
    WHEN sp.hora_llegada_custodio IS NOT NULL 
    THEN (sc.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamptz
    ELSE sc.hora_presentacion
  END AS hora_presentacion,
  
  -- Inicio: preferir hora_inicio_real de planeacion
  COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) AS hora_inicio_custodia,
  
  -- Arribo
  sc.hora_arribo,
  
  -- Fin: usar updated_time como proxy para finalizados
  CASE 
    WHEN sc.estado = 'Finalizado' AND sp.hora_fin_real IS NULL 
    THEN sc.updated_time
    ELSE COALESCE(sp.hora_fin_real, sc.hora_finalizacion)
  END AS hora_finalizacion,
  
  -- Duracion original
  sc.duracion_servicio,
  
  -- Duracion calculada con datos corregidos
  CASE 
    WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL 
     AND (
       (sc.estado = 'Finalizado' AND sc.updated_time IS NOT NULL) 
       OR sp.hora_fin_real IS NOT NULL
     )
    THEN 
      COALESCE(
        sp.hora_fin_real, 
        CASE WHEN sc.estado = 'Finalizado' THEN sc.updated_time ELSE NULL END
      ) - COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
    ELSE NULL
  END AS duracion_calculada,
  
  sc.tiempo_retraso,
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
  
  COALESCE(sp.custodio_asignado, sc.nombre_custodio) AS nombre_custodio,
  sp.custodio_id,
  sc.telefono AS telefono_custodio,
  sc.auto AS vehiculo_custodio,
  sc.placa AS placa_custodio,
  COALESCE(sp.armado_asignado, sc.nombre_armado) AS nombre_armado,
  sp.armado_id,
  sc.telefono_armado,
  sp.tipo_asignacion_armado,
  sc.proveedor,
  COALESCE(sp.requiere_armado, sc.requiere_armado) AS requiere_armado,
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.telefono_operador,
  sc.placa_carga,
  sc.gadget,
  sc.tipo_gadget,
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
LEFT JOIN servicios_planificados sp 
  ON sc.id_servicio = sp.id_servicio;