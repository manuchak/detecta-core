-- =============================================
-- FIX: Separar custodios de armados en vista
-- Problema: UNION ALL con leads incluye candidatos a custodio
-- Solución: Eliminar UNION ALL, solo mostrar armados reales
-- =============================================

-- Eliminar vista existente
DROP VIEW IF EXISTS public.armados_disponibles_extendido;

-- Recrear vista SIN el UNION con leads
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
  -- Mantener columnas para compatibilidad de tipos
  FALSE as es_lead_virtual,
  NULL::text as lead_id_origen,
  NULL::text as lead_estado_original,
  -- Columnas de actividad reciente
  ar.fecha_ultimo_servicio as fecha_ultimo_servicio_real,
  COALESCE(ar.total_servicios_90dias, 0) as servicios_90dias,
  COALESCE(ar.total_servicios_historico, 0) as servicios_historico_total,
  (COALESCE(ar.total_servicios_90dias, 0) > 0) as tiene_actividad_90dias
FROM armados_operativos ao
LEFT JOIN actividad_reciente ar 
  ON ar.nombre_normalizado = UPPER(REPLACE(REPLACE(REPLACE(TRIM(ao.nombre), ' ', ''), '-', ''), '.', ''))
WHERE ao.estado = 'activo';

-- NO incluir UNION ALL con leads - esos son candidatos a custodio, no armados

COMMENT ON VIEW armados_disponibles_extendido IS
'Vista de armados operativos disponibles para asignación.
Solo incluye personal armado confirmado de armados_operativos.
Incluye columnas de actividad reciente calculadas desde servicios_custodia:
- fecha_ultimo_servicio_real: Última fecha de servicio en servicios_custodia
- servicios_90dias: Conteo de servicios en últimos 90 días
- tiene_actividad_90dias: Boolean para filtrar armados activos
NOTA: No incluye leads de Supply ya que esos son candidatos a custodio.';

-- Configurar seguridad
ALTER VIEW armados_disponibles_extendido SET (security_invoker = true);
GRANT SELECT ON armados_disponibles_extendido TO authenticated;