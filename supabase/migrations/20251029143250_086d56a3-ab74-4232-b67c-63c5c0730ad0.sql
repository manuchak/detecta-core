-- ============================================
-- FASE 1 (CORREGIDA): Crear Vista Unificada de Armados + Leads de Supply
-- ============================================
-- Corrección: user_roles.role (no role_name)

CREATE OR REPLACE VIEW armados_disponibles_extendido AS
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
  -- Leads de Supply como "armados virtuales"
  gen_random_uuid() as id,
  l.nombre,
  l.telefono,
  l.email,
  'Por asignar' as zona_base,
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
  NULL::timestamp as fecha_ultimo_servicio,
  l.created_at,
  l.updated_at,
  TRUE as es_lead_virtual,
  l.id as lead_id_origen,
  l.estado as lead_estado_original
FROM leads l
WHERE l.estado IN ('contactado', 'aprobado')
  AND l.telefono IS NOT NULL
  AND l.email IS NOT NULL
  -- Excluir leads que ya tienen armado operativo creado
  AND NOT EXISTS (
    SELECT 1 FROM armados_operativos ao
    WHERE ao.telefono = l.telefono
       OR ao.email = l.email
  );

COMMENT ON VIEW armados_disponibles_extendido IS 
'Vista que combina armados operativos reales con leads de Supply aprobados/contactados.
Permite a Planeación visualizar candidatos antes de su conversión formal.
Los leads virtuales se identifican con es_lead_virtual=true y badge "Nuevo (0 servicios)".
SECURITY: Usa security_invoker para heredar permisos de usuario autenticado.';

-- Configurar seguridad de la vista
ALTER VIEW armados_disponibles_extendido SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON armados_disponibles_extendido TO authenticated;

-- ============================================
-- FASE 4A (CORREGIDA): RLS Policy para Permitir Conversión de Leads
-- ============================================

CREATE POLICY "planificadores_can_insert_armados"
ON armados_operativos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('planificador', 'admin', 'operations')
  )
);

COMMENT ON POLICY "planificadores_can_insert_armados" ON armados_operativos IS
'Permite a planificadores crear armados operativos al convertir leads de Supply.
Necesario para el flujo de conversión automática en primera asignación.';