-- RPC function to get armed guards available, bypassing RLS overhead on leads table
-- This is safe because the data returned is operational availability info needed by planners
CREATE OR REPLACE FUNCTION public.get_armados_disponibles_extendido()
RETURNS TABLE(
  id uuid,
  nombre text,
  telefono text,
  email text,
  zona_base text,
  estado text,
  disponibilidad text,
  tipo_armado text,
  numero_servicios integer,
  rating_promedio numeric,
  tasa_confirmacion numeric,
  tasa_respuesta numeric,
  tasa_confiabilidad numeric,
  score_comunicacion numeric,
  score_disponibilidad numeric,
  score_confiabilidad numeric,
  score_total numeric,
  experiencia_anos integer,
  licencia_portacion text,
  fecha_vencimiento_licencia date,
  equipamiento_disponible text[],
  zonas_permitidas text[],
  servicios_permitidos text[],
  restricciones_horario jsonb,
  proveedor_id uuid,
  fuente text,
  fecha_ultimo_servicio timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  es_lead_virtual boolean,
  lead_id_origen text,
  lead_estado_original text,
  fecha_ultimo_servicio_real timestamptz,
  servicios_90dias integer,
  servicios_historico_total integer,
  tiene_actividad_90dias boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH actividad_por_armado AS (
    SELECT 
      aa.armado_id,
      max(sc.fecha_hora_cita) AS fecha_ultimo_servicio_real,
      count(*) FILTER (WHERE sc.fecha_hora_cita >= (CURRENT_DATE - '90 days'::interval)) AS servicios_90dias,
      count(*) AS servicios_historico_total
    FROM asignacion_armados aa
    JOIN servicios_custodia sc ON aa.servicio_custodia_id = sc.id_servicio
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
    COALESCE(act.servicios_90dias, 0::bigint)::integer AS servicios_90dias,
    COALESCE(act.servicios_historico_total, 0::bigint)::integer AS servicios_historico_total,
    (act.servicios_90dias > 0) AS tiene_actividad_90dias
  FROM armados_operativos ao
  LEFT JOIN actividad_por_armado act ON act.armado_id = ao.id
  WHERE ao.estado = 'activo' AND ao.tipo_armado = 'interno'
  
  UNION ALL
  
  SELECT 
    l.id::uuid,
    l.nombre,
    l.telefono,
    l.email,
    NULL::text,
    'activo'::text,
    'disponible'::text,
    'interno'::text,
    0,
    0::numeric,
    100::numeric,
    100::numeric,
    100::numeric,
    50::numeric,
    50::numeric,
    50::numeric,
    50::numeric,
    0,
    NULL::text,
    NULL::date,
    NULL::text[],
    NULL::text[],
    NULL::text[],
    NULL::jsonb,
    NULL::uuid,
    'lead_virtual'::text,
    NULL::timestamptz,
    l.created_at,
    l.updated_at,
    true,
    l.id,
    l.estado,
    NULL::timestamptz,
    0,
    0,
    false
  FROM leads l
  WHERE l.estado = 'aprobado'
    AND l.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND l.telefono IS NOT NULL 
    AND length(l.telefono) >= 10
    AND NOT EXISTS (
      SELECT 1 FROM armados_operativos ao2
      WHERE ao2.nombre = l.nombre OR ao2.telefono = l.telefono
    )
  ORDER BY es_lead_virtual, score_total DESC NULLS LAST, nombre;
END;
$$;