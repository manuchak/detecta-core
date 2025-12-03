
-- =====================================================
-- CORRECCIONES DE SEGURIDAD - MÓDULO PLANEACIÓN
-- =====================================================

-- 1. CORREGIR FUNCIONES SIN search_path
-- =====================================================

-- 1.1 Corregir incidentes_en_radio
CREATE OR REPLACE FUNCTION public.incidentes_en_radio(
  p_lat numeric, 
  p_lng numeric, 
  p_radio_km integer DEFAULT 10, 
  p_tipo_incidente character varying DEFAULT NULL::character varying, 
  p_dias_atras integer DEFAULT 30
)
RETURNS TABLE(
  id uuid, 
  tipo_incidente character varying, 
  severidad character varying, 
  distancia_km numeric, 
  fecha_publicacion timestamp with time zone, 
  ubicacion_texto_original text, 
  texto_original text, 
  keywords_detectados text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.tipo_incidente,
    i.severidad,
    ROUND(
      6371 * 2 * ASIN(SQRT(
        POWER(SIN((i.coordenadas_lat - p_lat) * PI() / 180 / 2), 2) +
        COS(p_lat * PI() / 180) * COS(i.coordenadas_lat * PI() / 180) *
        POWER(SIN((i.coordenadas_lng - p_lng) * PI() / 180 / 2), 2)
      ))
    , 2) AS distancia_km,
    i.fecha_publicacion,
    i.ubicacion_texto_original,
    i.texto_original,
    i.keywords_detectados
  FROM incidentes_rrss i
  WHERE i.coordenadas_lat IS NOT NULL
    AND i.coordenadas_lng IS NOT NULL
    AND i.procesado = true
    AND i.fecha_publicacion >= NOW() - INTERVAL '1 day' * p_dias_atras
    AND (p_tipo_incidente IS NULL OR i.tipo_incidente = p_tipo_incidente)
    AND ROUND(
      6371 * 2 * ASIN(SQRT(
        POWER(SIN((i.coordenadas_lat - p_lat) * PI() / 180 / 2), 2) +
        COS(p_lat * PI() / 180) * COS(i.coordenadas_lat * PI() / 180) *
        POWER(SIN((i.coordenadas_lng - p_lng) * PI() / 180 / 2), 2)
      ))
    , 2) <= p_radio_km
  ORDER BY distancia_km ASC;
END;
$$;

-- 1.2 Corregir sync_lead_to_candidato
CREATE OR REPLACE FUNCTION public.sync_lead_to_candidato(
  p_lead_id text, 
  p_nombre text, 
  p_email text, 
  p_telefono text, 
  p_fuente text, 
  p_estado_proceso text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidato_id UUID;
BEGIN
  -- Buscar candidato existente por email o teléfono
  SELECT id INTO v_candidato_id
  FROM candidatos_custodios
  WHERE email = p_email OR telefono = p_telefono
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    -- Crear nuevo candidato
    INSERT INTO candidatos_custodios (
      nombre,
      email,
      telefono,
      estado_proceso,
      fuente_reclutamiento,
      created_at,
      updated_at
    ) VALUES (
      p_nombre,
      p_email,
      p_telefono,
      p_estado_proceso,
      p_fuente,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_candidato_id;
  ELSE
    -- Actualizar candidato existente
    UPDATE candidatos_custodios
    SET 
      estado_proceso = p_estado_proceso,
      updated_at = NOW()
    WHERE id = v_candidato_id;
  END IF;

  -- Vincular lead con candidato
  UPDATE leads
  SET candidato_custodio_id = v_candidato_id,
      updated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_candidato_id;
END;
$$;

-- 1.3 Corregir sync_instalacion_completada_to_liberacion
CREATE OR REPLACE FUNCTION public.sync_instalacion_completada_to_liberacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo procesar cuando se marca como completada una instalación de custodio
  IF NEW.estado = 'completada' 
     AND NEW.tipo_contexto = 'custodio' 
     AND NEW.candidato_id IS NOT NULL 
     AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN
    
    -- Actualizar el checklist de liberación
    UPDATE custodio_liberacion
    SET instalacion_gps_completado = true,
        fecha_instalacion_gps = COALESCE(NEW.fecha_completada, NOW()),
        updated_at = NOW()
    WHERE candidato_id = NEW.candidato_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. SEGURIDAD DE MATERIALIZED VIEWS
-- =====================================================
-- Las MVs no tienen RLS pero son de solo lectura.
-- Revocamos acceso anon y damos solo a authenticated.

REVOKE ALL ON public.custodios_operativos_activos FROM anon;
REVOKE ALL ON public.armados_operativos_disponibles FROM anon;
REVOKE ALL ON public.custodios_operativos_disponibles FROM anon;

GRANT SELECT ON public.custodios_operativos_activos TO authenticated;
GRANT SELECT ON public.armados_operativos_disponibles TO authenticated;
GRANT SELECT ON public.custodios_operativos_disponibles TO authenticated;

-- 3. ÍNDICES DE RENDIMIENTO PARA PLANEACIÓN
-- =====================================================

-- Índice para búsqueda de servicios por estado y fecha
CREATE INDEX IF NOT EXISTS idx_servicios_custodia_estado_fecha 
ON servicios_custodia(estado, fecha_hora_cita DESC);

-- Índice para búsqueda de custodios por zona
CREATE INDEX IF NOT EXISTS idx_custodios_operativos_zona_estado 
ON custodios_operativos(zona_base, estado) 
WHERE estado = 'activo';

-- Índice para incidentes geoespaciales
CREATE INDEX IF NOT EXISTS idx_incidentes_rrss_geo 
ON incidentes_rrss(coordenadas_lat, coordenadas_lng) 
WHERE coordenadas_lat IS NOT NULL AND coordenadas_lng IS NOT NULL;

-- 4. COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.incidentes_en_radio IS 
'Busca incidentes de seguridad en un radio específico usando fórmula Haversine. Requiere search_path para seguridad.';

COMMENT ON FUNCTION public.sync_lead_to_candidato IS 
'Sincroniza un lead aprobado con la tabla de candidatos custodios. Crea nuevo candidato si no existe.';

COMMENT ON FUNCTION public.sync_instalacion_completada_to_liberacion IS 
'Trigger que actualiza el checklist de liberación cuando se completa una instalación de custodio.';

COMMENT ON MATERIALIZED VIEW public.custodios_operativos_activos IS 
'Vista materializada de custodios con actividad reciente (últimos 90 días, mínimo 3 servicios). Solo acceso autenticado.';

COMMENT ON MATERIALIZED VIEW public.armados_operativos_disponibles IS 
'Vista materializada de elementos armados activos con datos de disponibilidad. Solo acceso autenticado.';

COMMENT ON MATERIALIZED VIEW public.custodios_operativos_disponibles IS 
'Vista materializada de custodios disponibles filtrados por estado y actividad. Solo acceso autenticado.';
