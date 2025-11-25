-- Crear tabla incidentes_rrss con soporte geoespacial
CREATE TABLE incidentes_rrss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origen del dato
  red_social VARCHAR NOT NULL CHECK (red_social IN ('twitter', 'facebook', 'instagram')),
  apify_actor_id VARCHAR,
  apify_run_id VARCHAR,
  url_publicacion TEXT,
  
  -- Datos de la publicación
  autor VARCHAR,
  fecha_publicacion TIMESTAMPTZ,
  texto_original TEXT NOT NULL,
  hashtags TEXT[],
  menciones TEXT[],
  media_urls TEXT[],
  engagement_likes INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  
  -- UBICACIÓN (Geocoding Híbrido)
  ubicacion_texto_original TEXT,
  ubicacion_normalizada VARCHAR,
  estado VARCHAR,
  municipio VARCHAR,
  carretera VARCHAR,
  coordenadas_lat DECIMAL(10, 8),
  coordenadas_lng DECIMAL(11, 8),
  geocoding_metodo VARCHAR CHECK (geocoding_metodo IN ('diccionario', 'mapbox', 'manual')),
  geocoding_confianza INTEGER CHECK (geocoding_confianza BETWEEN 0 AND 100),
  
  -- CLASIFICACIÓN TRANSPORTE DE CARGA
  tipo_incidente VARCHAR NOT NULL DEFAULT 'sin_clasificar' CHECK (tipo_incidente IN (
    'robo_carga',
    'robo_unidad',
    'robo_combustible',
    'robo_autopartes',
    'asalto_transporte',
    'bloqueo_carretera',
    'accidente_trailer',
    'secuestro_operador',
    'extorsion',
    'vandalismo_unidad',
    'otro',
    'sin_clasificar'
  )),
  subtipo VARCHAR,
  severidad VARCHAR CHECK (severidad IN ('baja', 'media', 'alta', 'critica')),
  
  -- Análisis AI
  keywords_detectados TEXT[],
  entidades_mencionadas JSONB,
  sentimiento VARCHAR CHECK (sentimiento IN ('negativo', 'neutro', 'positivo')),
  resumen_ai TEXT,
  confianza_clasificacion INTEGER CHECK (confianza_clasificacion BETWEEN 0 AND 100),
  
  -- Datos específicos de transporte
  tipo_carga_mencionada VARCHAR,
  monto_perdida_estimado DECIMAL(12, 2),
  empresa_afectada VARCHAR,
  num_victimas INTEGER,
  armas_mencionadas BOOLEAN,
  grupo_delictivo_atribuido VARCHAR,
  
  -- Control de procesamiento
  procesado BOOLEAN DEFAULT false,
  procesado_at TIMESTAMPTZ,
  error_procesamiento TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX idx_incidentes_tipo ON incidentes_rrss(tipo_incidente);
CREATE INDEX idx_incidentes_fecha ON incidentes_rrss(fecha_publicacion DESC);
CREATE INDEX idx_incidentes_estado ON incidentes_rrss(estado);
CREATE INDEX idx_incidentes_carretera ON incidentes_rrss(carretera) WHERE carretera IS NOT NULL;
CREATE INDEX idx_incidentes_coordenadas ON incidentes_rrss(coordenadas_lat, coordenadas_lng) WHERE coordenadas_lat IS NOT NULL;
CREATE INDEX idx_incidentes_procesado ON incidentes_rrss(procesado);
CREATE INDEX idx_incidentes_url ON incidentes_rrss(url_publicacion);

-- RLS Policies
ALTER TABLE incidentes_rrss ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON incidentes_rrss
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read" ON incidentes_rrss
  FOR SELECT TO authenticated USING (true);

-- Función SQL para consultar incidentes en radio (criminología ambiental)
CREATE OR REPLACE FUNCTION incidentes_en_radio(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_radio_km INTEGER DEFAULT 10,
  p_tipo_incidente VARCHAR DEFAULT NULL,
  p_dias_atras INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  tipo_incidente VARCHAR,
  severidad VARCHAR,
  distancia_km DECIMAL,
  fecha_publicacion TIMESTAMPTZ,
  ubicacion_texto_original TEXT,
  texto_original TEXT,
  keywords_detectados TEXT[]
) AS $$
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
  HAVING distancia_km <= p_radio_km
  ORDER BY distancia_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidentes_rrss_updated_at
  BEFORE UPDATE ON incidentes_rrss
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();