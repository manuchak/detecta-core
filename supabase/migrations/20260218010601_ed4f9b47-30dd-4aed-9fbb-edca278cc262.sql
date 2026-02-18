
-- Paso 1: Índices para optimizar la vista
CREATE INDEX IF NOT EXISTS idx_asignacion_armados_armado_id ON asignacion_armados(armado_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_armados_servicio_custodia_id ON asignacion_armados(servicio_custodia_id);

-- Paso 2: Reescribir vista con CTEs pre-agregados (elimina subqueries correlacionadas)
CREATE OR REPLACE VIEW armados_disponibles_extendido
WITH (security_invoker = true)
AS
WITH actividad_por_armado AS (
  SELECT 
    aa.armado_id,
    MAX(sc.fecha_hora_cita) AS fecha_ultimo_servicio_real,
    COUNT(*) FILTER (WHERE sc.fecha_hora_cita >= CURRENT_DATE - INTERVAL '90 days') AS servicios_90dias,
    COUNT(*) AS servicios_historico_total
  FROM asignacion_armados aa
  JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id::text
  GROUP BY aa.armado_id
)
SELECT 
  ao.id,
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
  act.fecha_ultimo_servicio_real,
  COALESCE(act.servicios_90dias, 0)::integer AS servicios_90dias,
  COALESCE(act.servicios_historico_total, 0)::integer AS servicios_historico_total,
  (act.servicios_90dias > 0) AS tiene_actividad_90dias
FROM armados_operativos ao
LEFT JOIN actividad_por_armado act ON act.armado_id = ao.id
WHERE ao.estado = 'activo' AND ao.tipo_armado = 'interno'

UNION ALL

SELECT 
  l.id::uuid AS id,
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
  AND NOT EXISTS (
    SELECT 1 FROM armados_operativos ao
    WHERE ao.nombre = l.nombre OR ao.telefono = l.telefono
  )
  AND l.telefono IS NOT NULL
  AND length(l.telefono) >= 10
ORDER BY 30, 17 DESC NULLS LAST, 2;
