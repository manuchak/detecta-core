
-- 1. Add hora_estimada and dia_semana_estimado columns
ALTER TABLE incidentes_rrss 
  ADD COLUMN IF NOT EXISTS hora_estimada INTEGER,
  ADD COLUMN IF NOT EXISTS dia_semana_estimado INTEGER;

-- 2. Create frequency view
CREATE OR REPLACE VIEW vista_frecuencia_incidentes AS
SELECT
  date_trunc('week', fecha_publicacion) AS semana,
  tipo_incidente,
  severidad,
  estado,
  carretera,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE severidad IN ('alta','critica')) AS criticos,
  AVG(confianza_clasificacion) AS confianza_promedio
FROM incidentes_rrss
WHERE procesado = true
GROUP BY 1, 2, 3, 4, 5;

-- 3. RPC: risk score per corridor
CREATE OR REPLACE FUNCTION calcular_score_corredor(p_carretera TEXT)
RETURNS TABLE(
  carretera TEXT,
  total_incidentes BIGINT,
  incidentes_7d BIGINT,
  incidentes_30d BIGINT,
  criticos_30d BIGINT,
  score_riesgo NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.carretera,
    COUNT(*)::BIGINT AS total_incidentes,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '7 days')::BIGINT AS incidentes_7d,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days')::BIGINT AS incidentes_30d,
    COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days' AND i.severidad IN ('alta','critica'))::BIGINT AS criticos_30d,
    LEAST(100, (
      COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '7 days') * 15 +
      COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days' AND i.severidad IN ('alta','critica')) * 10 +
      COUNT(*) FILTER (WHERE i.fecha_publicacion >= NOW() - INTERVAL '30 days') * 3
    ))::NUMERIC AS score_riesgo
  FROM incidentes_rrss i
  WHERE i.procesado = true
    AND i.carretera IS NOT NULL
    AND (p_carretera IS NULL OR i.carretera ILIKE '%' || p_carretera || '%')
  GROUP BY i.carretera;
END;
$$;

-- 4. Trigger: auto-alert when corridor exceeds threshold
CREATE OR REPLACE FUNCTION fn_alerta_umbral_incidentes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_zona TEXT;
BEGIN
  IF NEW.procesado = true AND NEW.severidad IN ('alta', 'critica') THEN
    v_zona := COALESCE(NEW.carretera, NEW.estado, 'Desconocida');
    
    SELECT COUNT(*) INTO v_count
    FROM incidentes_rrss
    WHERE procesado = true
      AND severidad IN ('alta', 'critica')
      AND fecha_publicacion >= NOW() - INTERVAL '7 days'
      AND (
        (NEW.carretera IS NOT NULL AND carretera = NEW.carretera)
        OR (NEW.carretera IS NULL AND NEW.estado IS NOT NULL AND estado = NEW.estado)
      );
    
    IF v_count >= 5 THEN
      INSERT INTO alertas_sistema_nacional (
        tipo_alerta, categoria, titulo, descripcion, prioridad, estado,
        acciones_sugeridas, datos_contexto
      ) VALUES (
        'umbral_incidentes',
        'seguridad',
        'Alerta: ' || v_count || ' incidentes críticos en ' || v_zona,
        'Se han detectado ' || v_count || ' incidentes de severidad alta/crítica en ' || v_zona || ' en los últimos 7 días.',
        CASE WHEN v_count >= 10 THEN 1 WHEN v_count >= 7 THEN 2 ELSE 3 END,
        'nueva',
        ARRAY['Revisar rutas activas en la zona', 'Notificar a custodios asignados', 'Considerar ruta alterna'],
        jsonb_build_object('zona', v_zona, 'conteo', v_count, 'trigger_incidente_id', NEW.id)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerta_umbral_incidentes ON incidentes_rrss;
CREATE TRIGGER trg_alerta_umbral_incidentes
  AFTER UPDATE ON incidentes_rrss
  FOR EACH ROW
  WHEN (NEW.procesado = true AND OLD.procesado IS DISTINCT FROM NEW.procesado)
  EXECUTE FUNCTION fn_alerta_umbral_incidentes();
