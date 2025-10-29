-- Corrección 2 (corregida tipos): Vista armados_disponibles_extendido con UUIDs determinísticos

-- Asegurar que la extensión uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP VIEW IF EXISTS public.armados_disponibles_extendido;

CREATE OR REPLACE VIEW public.armados_disponibles_extendido AS
SELECT 
  -- Armados reales de la tabla armados_operativos
  id,
  nombre,
  telefono,
  email,
  zona_base,
  estado,
  disponibilidad,
  tipo_armado,
  numero_servicios,
  rating_promedio,
  tasa_confirmacion,
  tasa_respuesta,
  tasa_confiabilidad,
  score_comunicacion,
  score_disponibilidad,
  score_confiabilidad,
  score_total,
  experiencia_anos,
  licencia_portacion,
  fecha_vencimiento_licencia,
  equipamiento_disponible,
  zonas_permitidas,
  servicios_permitidos,
  restricciones_horario,
  proveedor_id,
  fuente,
  fecha_ultimo_servicio,
  created_at,
  updated_at,
  FALSE as es_lead_virtual,
  NULL::text as lead_id_origen,
  NULL::text as lead_estado_original
FROM armados_operativos
WHERE estado = 'activo'

UNION ALL

SELECT 
  -- Leads virtuales: UUID determinístico basado en el ID del lead
  -- Usamos uuid_generate_v5 con namespace fijo para garantizar estabilidad
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
  l.estado as lead_estado_original
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
Formato: uuid_generate_v5(namespace_dns, "lead-{lead_id}")
Esto garantiza estabilidad en queries repetidas.';

ALTER VIEW armados_disponibles_extendido SET (security_invoker = true);
GRANT SELECT ON armados_disponibles_extendido TO authenticated;