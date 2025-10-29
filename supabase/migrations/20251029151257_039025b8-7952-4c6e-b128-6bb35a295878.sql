-- Fix armados_disponibles_extendido view - Correct UUID handling and permissions

DROP VIEW IF EXISTS armados_disponibles_extendido;

CREATE OR REPLACE VIEW armados_disponibles_extendido AS
SELECT 
  -- Armados reales de la tabla armados_operativos
  id::uuid,  -- Explicit UUID cast
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
  FALSE as es_lead_virtual,  -- Armado real
  NULL::text as lead_id_origen,
  NULL::text as lead_estado_original
FROM armados_operativos
WHERE estado = 'activo'

UNION ALL

SELECT 
  -- Leads de Supply como "armados virtuales"
  gen_random_uuid() as id,  -- Generate unique UUID for each lead virtual
  l.nombre,
  l.telefono,
  l.email,
  'Por asignar' as zona_base,  -- Zona pendiente hasta primera asignación
  'activo' as estado,
  'disponible' as disponibilidad,
  'interno' as tipo_armado,
  0 as numero_servicios,  -- Badge "Nuevo"
  5.0 as rating_promedio,  -- Rating neutro inicial
  0.0 as tasa_confirmacion,
  0.0 as tasa_respuesta,
  0.0 as tasa_confiabilidad,
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
  TRUE as es_lead_virtual,  -- Flag de armado virtual
  l.id as lead_id_origen,  -- ID original del lead
  l.estado as lead_estado_original
FROM leads l
WHERE l.estado IN ('contactado', 'aprobado')  -- Solo leads con contacto inicial exitoso
  AND l.telefono IS NOT NULL
  AND l.email IS NOT NULL
  -- Excluir leads que ya tienen armado operativo creado
  AND NOT EXISTS (
    SELECT 1 FROM armados_operativos ao
    WHERE ao.telefono = l.telefono
       OR ao.email = l.email
  );

-- Set security invoker to use caller's permissions
ALTER VIEW armados_disponibles_extendido SET (security_invoker = true);

-- Grant SELECT to authenticated users
GRANT SELECT ON armados_disponibles_extendido TO authenticated;

COMMENT ON VIEW armados_disponibles_extendido IS 
'Vista que combina armados operativos reales con leads de Supply aprobados/contactados.
Permite a Planeación visualizar candidatos antes de su conversión formal.
Los leads virtuales se identifican con es_lead_virtual=true y badge "Nuevo (0 servicios)".
CORRECCIÓN: UUID handling mejorado y permisos ajustados para evitar errores de conversión.';