-- ============================================================
-- Función para calcular fecha de último servicio desde servicios_custodia
-- Usa normalización de nombres para matching entre tablas
-- ============================================================

CREATE OR REPLACE FUNCTION get_armados_actividad_reciente()
RETURNS TABLE (
  nombre_normalizado TEXT,
  fecha_ultimo_servicio TIMESTAMPTZ,
  total_servicios_90dias INTEGER,
  total_servicios_historico INTEGER
) AS $$
  SELECT 
    UPPER(REPLACE(REPLACE(REPLACE(TRIM(nombre_armado), ' ', ''), '-', ''), '.', '')) as nombre_normalizado,
    MAX(fecha_hora_cita) as fecha_ultimo_servicio,
    COUNT(*) FILTER (WHERE fecha_hora_cita >= CURRENT_DATE - INTERVAL '90 days')::INTEGER as total_servicios_90dias,
    COUNT(*)::INTEGER as total_servicios_historico
  FROM servicios_custodia
  WHERE nombre_armado IS NOT NULL 
    AND TRIM(nombre_armado) != ''
  GROUP BY UPPER(REPLACE(REPLACE(REPLACE(TRIM(nombre_armado), ' ', ''), '-', ''), '.', ''))
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_armados_actividad_reciente IS 
'Calcula actividad reciente de armados desde servicios_custodia.
Usa normalización de nombres (mayúsculas, sin espacios/guiones/puntos) para matching.
Retorna fecha último servicio y conteo de servicios en últimos 90 días.';

-- ============================================================
-- Actualizar vista armados_disponibles_extendido con columnas de actividad
-- ============================================================

DROP VIEW IF EXISTS public.armados_disponibles_extendido;

CREATE VIEW public.armados_disponibles_extendido AS
WITH actividad_reciente AS (
  SELECT * FROM get_armados_actividad_reciente()
)
SELECT 
  -- Armados reales de la tabla armados_operativos
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
  -- Usar fecha de servicios_custodia si existe, sino la de armados_operativos
  COALESCE(ar.fecha_ultimo_servicio, ao.fecha_ultimo_servicio) as fecha_ultimo_servicio,
  ao.created_at,
  ao.updated_at,
  FALSE as es_lead_virtual,
  NULL::text as lead_id_origen,
  NULL::text as lead_estado_original,
  -- 🆕 Nuevas columnas de actividad reciente
  ar.fecha_ultimo_servicio as fecha_ultimo_servicio_real,
  COALESCE(ar.total_servicios_90dias, 0) as servicios_90dias,
  COALESCE(ar.total_servicios_historico, 0) as servicios_historico_total,
  (COALESCE(ar.total_servicios_90dias, 0) > 0) as tiene_actividad_90dias
FROM armados_operativos ao
LEFT JOIN actividad_reciente ar 
  ON ar.nombre_normalizado = UPPER(REPLACE(REPLACE(REPLACE(TRIM(ao.nombre), ' ', ''), '-', ''), '.', ''))
WHERE ao.estado = 'activo'

UNION ALL

SELECT 
  -- Leads virtuales: UUID determinístico basado en el ID del lead
  uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    'lead-' || l.id::text
  ) as id,
  l.nombre,
  l.telefono,
  l.email,
  COALESCE(
    (SELECT z.nombre FROM zonas_trabajo z WHERE z.id = l.zona_preferida_id LIMIT 1),
    'Por asignar'
  ) as zona_base,
  'activo' as estado,
  'disponible' as disponibilidad,
  'interno' as tipo_armado,
  0 as numero_servicios,
  5.0 as rating_promedio,
  0 as tasa_confirmacion,
  0 as tasa_respuesta,
  0 as tasa_confiabilidad,
  5.0 as score_comunicacion,
  5.0 as score_disponibilidad,
  5.0 as score_confiabilidad,
  5.0 as score_total,
  0 as experiencia_anos,
  'PENDIENTE VERIFICACIÓN' as licencia_portacion,
  NULL::date as fecha_vencimiento_licencia,
  NULL::text[] as equipamiento_disponible,
  ARRAY['Nacional']::text[] as zonas_permitidas,
  ARRAY['local', 'foraneo']::text[] as servicios_permitidos,
  '{}'::jsonb as restricciones_horario,
  NULL::uuid as proveedor_id,
  'candidato' as fuente,
  NULL::timestamp with time zone as fecha_ultimo_servicio,
  l.created_at,
  l.updated_at,
  TRUE as es_lead_virtual,
  l.id::text as lead_id_origen,
  l.estado as lead_estado_original,
  -- 🆕 Leads no tienen actividad histórica
  NULL::timestamp with time zone as fecha_ultimo_servicio_real,
  0 as servicios_90dias,
  0 as servicios_historico_total,
  FALSE as tiene_actividad_90dias
FROM leads l
WHERE l.estado IN ('contactado', 'aprobado')
  AND l.telefono IS NOT NULL
  AND l.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM armados_operativos ao
    WHERE ao.telefono = l.telefono
       OR ao.email = l.email
  );

COMMENT ON VIEW armados_disponibles_extendido IS
'Vista que combina armados operativos reales con leads de Supply elegibles.
UUIDs de leads virtuales son determinísticos usando uuid_generate_v5.
Incluye columnas de actividad reciente calculadas desde servicios_custodia:
- fecha_ultimo_servicio_real: Última fecha de servicio en servicios_custodia
- servicios_90dias: Conteo de servicios en últimos 90 días
- tiene_actividad_90dias: Boolean para filtrar armados activos';

ALTER VIEW armados_disponibles_extendido SET (security_invoker = true);
GRANT SELECT ON armados_disponibles_extendido TO authenticated;