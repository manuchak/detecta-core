-- =====================================================
-- Fix Bug 1: Restaurar visibilidad de leads aprobados como armados virtuales
-- =====================================================
-- Debe hacer DROP primero porque la estructura cambió

DROP VIEW IF EXISTS public.armados_disponibles_extendido CASCADE;

CREATE VIEW public.armados_disponibles_extendido AS
-- Armados operativos confirmados (fuente principal)
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
  FALSE as es_lead_virtual,
  NULL::text as lead_id_origen,
  NULL::text as lead_estado_original,
  -- Fecha del último servicio real (de asignaciones)
  (SELECT MAX(sc.fecha_hora_cita) 
   FROM servicios_custodia sc
   JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
   WHERE aa.armado_id = ao.id
  ) as fecha_ultimo_servicio_real,
  -- Cantidad de servicios en últimos 90 días
  COALESCE((SELECT COUNT(*) 
   FROM servicios_custodia sc
   JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
   WHERE aa.armado_id = ao.id
   AND sc.fecha_hora_cita >= CURRENT_DATE - INTERVAL '90 days'
  ), 0)::integer as servicios_90dias,
  -- Total histórico de servicios
  COALESCE((SELECT COUNT(*) 
   FROM asignacion_armados aa 
   WHERE aa.armado_id = ao.id
  ), 0)::integer as servicios_historico_total,
  -- Flag de actividad reciente
  CASE WHEN EXISTS (
    SELECT 1 FROM servicios_custodia sc
    JOIN asignacion_armados aa ON aa.servicio_custodia_id = sc.id::text
    WHERE aa.armado_id = ao.id
    AND sc.fecha_hora_cita >= CURRENT_DATE - INTERVAL '90 days'
  ) THEN TRUE ELSE FALSE END as tiene_actividad_90dias
FROM armados_operativos ao
WHERE ao.estado = 'activo'
  AND ao.tipo_armado = 'interno'

UNION ALL

-- Leads aprobados que NO han sido sincronizados a armados_operativos (virtuales)
SELECT 
  l.id::uuid as id,
  l.nombre,
  l.telefono,
  l.email,
  NULL::text as zona_base,
  'activo'::text as estado,
  'disponible'::text as disponibilidad,
  'interno'::text as tipo_armado,
  0::integer as numero_servicios,
  0::numeric as rating_promedio,
  100::numeric as tasa_confirmacion,
  100::numeric as tasa_respuesta,
  100::numeric as tasa_confiabilidad,
  50::numeric as score_comunicacion,
  50::numeric as score_disponibilidad,
  50::numeric as score_confiabilidad,
  50::numeric as score_total,
  0::integer as experiencia_anos,
  NULL::text as licencia_portacion,
  NULL::date as fecha_vencimiento_licencia,
  NULL::text[] as equipamiento_disponible,
  NULL::text[] as zonas_permitidas,
  NULL::text[] as servicios_permitidos,
  NULL::jsonb as restricciones_horario,
  NULL::uuid as proveedor_id,
  'lead_virtual'::text as fuente,
  NULL::timestamp with time zone as fecha_ultimo_servicio,
  l.created_at,
  l.updated_at,
  TRUE as es_lead_virtual,
  l.id as lead_id_origen,
  l.estado as lead_estado_original,
  NULL::timestamp with time zone as fecha_ultimo_servicio_real,
  0::integer as servicios_90dias,
  0::integer as servicios_historico_total,
  FALSE as tiene_actividad_90dias
FROM leads l
WHERE l.estado = 'aprobado'
  -- Solo leads con formato UUID válido
  AND l.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Excluir leads ya sincronizados
  AND NOT EXISTS (
    SELECT 1 FROM armados_operativos ao 
    WHERE ao.nombre = l.nombre 
       OR ao.telefono = l.telefono
  )
  -- Teléfono válido requerido
  AND l.telefono IS NOT NULL
  AND LENGTH(l.telefono) >= 10

ORDER BY es_lead_virtual ASC, score_total DESC NULLS LAST, nombre ASC;

COMMENT ON VIEW public.armados_disponibles_extendido IS 
'Vista unificada de armados disponibles para planeación.
Incluye: (1) Armados operativos confirmados (es_lead_virtual=FALSE), 
(2) Leads aprobados pendientes de sincronización (es_lead_virtual=TRUE).
Ordenado por personal confirmado primero, luego por score.';