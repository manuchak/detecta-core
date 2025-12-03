-- Fix security issues: set search_path on new functions

CREATE OR REPLACE FUNCTION calculate_semaforo_psicometrico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score_global >= 70 THEN
    NEW.resultado_semaforo := 'verde';
    NEW.requiere_aval_coordinacion := false;
  ELSIF NEW.score_global >= 50 THEN
    NEW.resultado_semaforo := 'ambar';
    NEW.requiere_aval_coordinacion := true;
    IF NEW.aval_decision IS NULL THEN
      NEW.aval_decision := 'pendiente';
    END IF;
  ELSE
    NEW.resultado_semaforo := 'rojo';
    NEW.requiere_aval_coordinacion := false;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION update_toxicologia_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION update_referencias_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix view security: use security_invoker
DROP VIEW IF EXISTS v_candidato_evaluaciones_completas;

CREATE VIEW v_candidato_evaluaciones_completas 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.nombre,
  c.estado_proceso,
  c.estado_detallado,
  e.rating_promedio as entrevista_rating,
  e.decision as entrevista_decision,
  r.risk_level,
  r.risk_score,
  p.score_global as psicometrico_score,
  p.resultado_semaforo,
  p.aval_decision as psicometrico_aval,
  t.resultado as toxicologia_resultado,
  (SELECT COUNT(*) FROM referencias_candidato 
   WHERE candidato_id = c.id AND tipo_referencia = 'laboral' AND resultado = 'positiva') as refs_laborales_ok,
  (SELECT COUNT(*) FROM referencias_candidato 
   WHERE candidato_id = c.id AND tipo_referencia = 'personal' AND resultado = 'positiva') as refs_personales_ok,
  CASE
    WHEN e.decision = 'aprobar' 
     AND (p.resultado_semaforo = 'verde' OR (p.resultado_semaforo = 'ambar' AND p.aval_decision = 'aprobado'))
     AND t.resultado = 'negativo'
     AND (SELECT COUNT(*) FROM referencias_candidato WHERE candidato_id = c.id AND resultado = 'positiva') >= 4
    THEN 'completo_aprobado'
    WHEN p.resultado_semaforo = 'rojo' OR t.resultado = 'positivo'
    THEN 'rechazado'
    ELSE 'en_proceso'
  END as estado_evaluacion
FROM candidatos_custodios c
LEFT JOIN LATERAL (
  SELECT rating_promedio, decision FROM entrevistas_estructuradas 
  WHERE candidato_id = c.id ORDER BY fecha_entrevista DESC LIMIT 1
) e ON true
LEFT JOIN candidato_risk_checklist r ON r.candidato_id = c.id
LEFT JOIN LATERAL (
  SELECT score_global, resultado_semaforo, aval_decision FROM evaluaciones_psicometricas 
  WHERE candidato_id = c.id ORDER BY created_at DESC LIMIT 1
) p ON true
LEFT JOIN LATERAL (
  SELECT resultado FROM evaluaciones_toxicologicas 
  WHERE candidato_id = c.id ORDER BY created_at DESC LIMIT 1
) t ON true;