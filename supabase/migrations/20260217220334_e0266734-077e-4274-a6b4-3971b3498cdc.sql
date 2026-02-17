-- Fix Security Definer Views: add security_invoker=true

-- 1. armados_disponibles_extendido
CREATE OR REPLACE VIEW public.armados_disponibles_extendido
WITH (security_invoker=on) AS
SELECT ao.id,
    ao.nombre,
    ao.telefono,
    ao.email,
    ao.zona_base,
    ao.estado,
    ao.disponibilidad,
    ao.tipo_armado,
    ao.numero_servicios,
    ao.rating_promedio,
    ao.tasa_confirmacion,
    ao.tasa_respuesta,
    ao.tasa_confiabilidad,
    ao.score_comunicacion,
    ao.score_disponibilidad,
    ao.score_confiabilidad,
    ao.score_total,
    ao.experiencia_anos,
    ao.licencia_portacion,
    ao.fecha_vencimiento_licencia,
    ao.equipamiento_disponible,
    ao.zonas_permitidas,
    ao.servicios_permitidos,
    ao.restricciones_horario,
    ao.proveedor_id,
    ao.fuente,
    ao.fecha_ultimo_servicio,
    ao.created_at,
    ao.updated_at,
    false AS es_lead_virtual,
    NULL::text AS lead_id_origen,
    NULL::text AS lead_estado_original,
    ( SELECT max(sc.fecha_hora_cita)
           FROM servicios_custodia sc
             JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
          WHERE aa.armado_id = ao.id) AS fecha_ultimo_servicio_real,
    COALESCE(( SELECT count(*)
           FROM servicios_custodia sc
             JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
          WHERE aa.armado_id = ao.id AND sc.fecha_hora_cita >= (CURRENT_DATE - '90 days'::interval)), 0)::integer AS servicios_90dias,
    COALESCE(( SELECT count(*)
           FROM asignacion_armados aa
          WHERE aa.armado_id = ao.id), 0)::integer AS servicios_historico_total,
    CASE
        WHEN EXISTS ( SELECT 1
           FROM servicios_custodia sc
             JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
          WHERE aa.armado_id = ao.id AND sc.fecha_hora_cita >= (CURRENT_DATE - '90 days'::interval)) THEN true
        ELSE false
    END AS tiene_actividad_90dias
   FROM armados_operativos ao
  WHERE ao.estado = 'activo' AND ao.tipo_armado = 'interno'
UNION ALL
 SELECT l.id::uuid AS id,
    l.nombre,
    l.telefono,
    l.email,
    NULL::text AS zona_base,
    'activo'::text AS estado,
    'disponible'::text AS disponibilidad,
    'interno'::text AS tipo_armado,
    0 AS numero_servicios,
    0::numeric AS rating_promedio,
    100::numeric AS tasa_confirmacion,
    100::numeric AS tasa_respuesta,
    100::numeric AS tasa_confiabilidad,
    50::numeric AS score_comunicacion,
    50::numeric AS score_disponibilidad,
    50::numeric AS score_confiabilidad,
    50::numeric AS score_total,
    0 AS experiencia_anos,
    NULL::text AS licencia_portacion,
    NULL::date AS fecha_vencimiento_licencia,
    NULL::text[] AS equipamiento_disponible,
    NULL::text[] AS zonas_permitidas,
    NULL::text[] AS servicios_permitidos,
    NULL::jsonb AS restricciones_horario,
    NULL::uuid AS proveedor_id,
    'lead_virtual'::text AS fuente,
    NULL::timestamp with time zone AS fecha_ultimo_servicio,
    l.created_at,
    l.updated_at,
    true AS es_lead_virtual,
    l.id AS lead_id_origen,
    l.estado AS lead_estado_original,
    NULL::timestamp with time zone AS fecha_ultimo_servicio_real,
    0 AS servicios_90dias,
    0 AS servicios_historico_total,
    false AS tiene_actividad_90dias
   FROM leads l
  WHERE l.estado = 'aprobado'
    AND l.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND NOT EXISTS ( SELECT 1 FROM armados_operativos ao WHERE ao.nombre = l.nombre OR ao.telefono = l.telefono)
    AND l.telefono IS NOT NULL
    AND length(l.telefono) >= 10
  ORDER BY 30, 17 DESC NULLS LAST, 2;

-- 2. crm_forecast_view
CREATE OR REPLACE VIEW public.crm_forecast_view
WITH (security_invoker=on) AS
SELECT s.id AS stage_id,
    s.name AS stage_name,
    s.order_nr,
    s.deal_probability,
    count(d.id) AS deals_count,
    COALESCE(sum(d.value), 0::numeric) AS total_value,
    COALESCE(sum(d.value * s.deal_probability::numeric / 100::numeric), 0::numeric) AS weighted_value
   FROM crm_pipeline_stages s
     LEFT JOIN crm_deals d ON d.stage_id = s.id AND d.status = 'open' AND d.is_deleted = false
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.order_nr, s.deal_probability
  ORDER BY s.order_nr;

-- 3. vw_aging_cuentas_cobrar
CREATE OR REPLACE VIEW public.vw_aging_cuentas_cobrar
WITH (security_invoker=on) AS
SELECT f.cliente_id,
    f.cliente_nombre,
    f.cliente_rfc,
    pc.dias_credito,
    pc.limite_credito,
    pc.prioridad_cobranza,
    sum(f.total) AS total_facturado,
    sum(COALESCE(p.total_pagado, 0::numeric)) AS total_pagado,
    sum(f.total - COALESCE(p.total_pagado, 0::numeric)) AS saldo_pendiente,
    sum(CASE WHEN f.fecha_vencimiento >= CURRENT_DATE THEN f.total - COALESCE(p.total_pagado, 0::numeric) ELSE 0::numeric END) AS vigente,
    sum(CASE WHEN (CURRENT_DATE - f.fecha_vencimiento) >= 1 AND (CURRENT_DATE - f.fecha_vencimiento) <= 30 THEN f.total - COALESCE(p.total_pagado, 0::numeric) ELSE 0::numeric END) AS vencido_1_30,
    sum(CASE WHEN (CURRENT_DATE - f.fecha_vencimiento) >= 31 AND (CURRENT_DATE - f.fecha_vencimiento) <= 60 THEN f.total - COALESCE(p.total_pagado, 0::numeric) ELSE 0::numeric END) AS vencido_31_60,
    sum(CASE WHEN (CURRENT_DATE - f.fecha_vencimiento) >= 61 AND (CURRENT_DATE - f.fecha_vencimiento) <= 90 THEN f.total - COALESCE(p.total_pagado, 0::numeric) ELSE 0::numeric END) AS vencido_61_90,
    sum(CASE WHEN (CURRENT_DATE - f.fecha_vencimiento) > 90 THEN f.total - COALESCE(p.total_pagado, 0::numeric) ELSE 0::numeric END) AS vencido_90_mas,
    count(DISTINCT f.id) AS num_facturas,
    max(f.fecha_vencimiento) AS ultima_factura,
    max(p.ultima_fecha_pago) AS ultimo_pago
   FROM facturas f
     LEFT JOIN pc_clientes pc ON f.cliente_id = pc.id
     LEFT JOIN ( SELECT pagos.factura_id,
            sum(pagos.monto) AS total_pagado,
            max(pagos.fecha_pago) AS ultima_fecha_pago
           FROM pagos
          WHERE pagos.estado = 'aplicado'
          GROUP BY pagos.factura_id) p ON f.id = p.factura_id
  WHERE f.estado <> 'cancelada'
  GROUP BY f.cliente_id, f.cliente_nombre, f.cliente_rfc, pc.dias_credito, pc.limite_credito, pc.prioridad_cobranza;

-- 4. vw_servicios_facturacion
CREATE OR REPLACE VIEW public.vw_servicios_facturacion
WITH (security_invoker=on) AS
SELECT sc.id,
    sc.id_servicio AS folio_saphiro,
    sc.id_servicio,
    sp.id_servicio AS folio_planeacion,
    sc.folio_cliente,
    sp.id_interno_cliente AS referencia_cliente,
    sp.id_interno_cliente,
    sp.created_at AS fecha_recepcion,
    sp.fecha_asignacion,
    sp.fecha_asignacion_armado,
    COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita) AS fecha_hora_cita,
    sc.fecha_hora_asignacion,
    CASE
        WHEN sp.hora_llegada_custodio IS NOT NULL THEN (sp.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamp with time zone
        ELSE sc.hora_presentacion
    END AS hora_presentacion,
    COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) AS hora_inicio_custodia,
    CASE
        WHEN sc.hora_arribo IS NOT NULL AND EXTRACT(hour FROM sc.hora_arribo) <> 0 THEN sc.hora_arribo
        ELSE NULL::timestamp with time zone
    END AS hora_arribo,
    COALESCE(sp.hora_fin_real, sc.hora_finalizacion) AS hora_finalizacion,
    sc.duracion_servicio,
    CASE
        WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL AND COALESCE(sp.hora_fin_real, sc.hora_finalizacion) IS NOT NULL
        THEN COALESCE(sp.hora_fin_real, sc.hora_finalizacion) - COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
        ELSE NULL::interval
    END AS duracion_calculada,
    CASE
        WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL AND COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita) IS NOT NULL
        THEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) - COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita)
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
        WHEN COALESCE(sc.km_teorico, 0::numeric) > 0::numeric THEN round(((sc.km_recorridos - sc.km_teorico) / sc.km_teorico) * 100::numeric, 1)
        ELSE NULL::numeric
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
    CASE
        WHEN sp.tipo_asignacion_armado = 'proveedor' AND sp.proveedor_armado_id IS NOT NULL THEN pa.nombre_empresa
        ELSE NULL::text
    END AS proveedor,
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
    (COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0::numeric) - COALESCE(sc.costo_custodio, 0::numeric)) AS margen_bruto,
    CASE
        WHEN COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0::numeric) > 0::numeric
        THEN round(((COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0::numeric) - COALESCE(sc.costo_custodio, 0::numeric)) / COALESCE(sp.tarifa_acordada, sc.cobro_cliente)) * 100::numeric, 1)
        ELSE 0::numeric
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