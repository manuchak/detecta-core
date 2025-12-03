-- ============================================
-- SPRINT 2: Psicométricos, Toxicología y Referencias
-- ============================================

-- 1. Tabla de evaluaciones psicométricas
CREATE TABLE IF NOT EXISTS evaluaciones_psicometricas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  evaluador_id uuid NOT NULL REFERENCES profiles(id),
  
  -- Scores por módulo (0-100)
  score_integridad numeric,
  score_psicopatia numeric,
  score_violencia numeric,
  score_agresividad numeric,
  score_afrontamiento numeric,
  score_veracidad numeric,
  score_entrevista numeric,
  
  -- Score global y clasificación
  score_global numeric NOT NULL,
  percentiles jsonb,
  interpretacion_clinica text,
  risk_flags text[],
  
  -- Sistema de semáforo automático
  resultado_semaforo varchar NOT NULL CHECK (resultado_semaforo IN ('verde', 'ambar', 'rojo')),
  requiere_aval_coordinacion boolean DEFAULT false,
  
  -- Aval de Coordinación (solo para casos ámbar)
  aval_coordinacion_id uuid REFERENCES profiles(id),
  aval_decision varchar CHECK (aval_decision IN ('aprobado', 'rechazado', 'pendiente')),
  aval_notas text,
  fecha_aval timestamp with time zone,
  
  -- Estado del registro
  estado varchar DEFAULT 'completado' CHECK (estado IN ('en_progreso', 'completado', 'invalidado')),
  
  -- Auditoría
  fecha_evaluacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabla de evaluaciones toxicológicas
CREATE TABLE IF NOT EXISTS evaluaciones_toxicologicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  registrado_por uuid NOT NULL REFERENCES profiles(id),
  
  -- Resultado binario
  resultado varchar NOT NULL CHECK (resultado IN ('negativo', 'positivo')),
  
  -- Detalles del examen
  laboratorio varchar,
  fecha_muestra timestamp with time zone,
  fecha_resultados timestamp with time zone,
  sustancias_detectadas text[],
  
  -- Documentación
  archivo_url text,
  notas text,
  
  -- Auditoría
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabla de referencias de candidatos
CREATE TABLE IF NOT EXISTS referencias_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  validador_id uuid REFERENCES profiles(id),
  
  -- Tipo de referencia
  tipo_referencia varchar NOT NULL CHECK (tipo_referencia IN ('laboral', 'personal')),
  
  -- Datos de la referencia
  nombre_referencia varchar NOT NULL,
  relacion varchar,
  empresa_institucion varchar,
  cargo_referencia varchar,
  telefono varchar,
  email varchar,
  
  -- Resultado de validación
  contactado boolean DEFAULT false,
  fecha_contacto timestamp with time zone,
  resultado varchar DEFAULT 'pendiente' CHECK (resultado IN ('positiva', 'negativa', 'no_contactado', 'invalida', 'pendiente')),
  
  -- Detalles de la validación
  comentarios_referencia text,
  red_flags text[],
  calificacion integer CHECK (calificacion BETWEEN 1 AND 5),
  tiempo_conocido varchar,
  
  -- Auditoría
  notas_validador text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Trigger para calcular semáforo psicométrico automáticamente
CREATE OR REPLACE FUNCTION calculate_semaforo_psicometrico()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular semáforo basado en score_global
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_semaforo ON evaluaciones_psicometricas;
CREATE TRIGGER trg_calculate_semaforo
BEFORE INSERT OR UPDATE OF score_global ON evaluaciones_psicometricas
FOR EACH ROW EXECUTE FUNCTION calculate_semaforo_psicometrico();

-- 5. Trigger para actualizar updated_at en toxicología
CREATE OR REPLACE FUNCTION update_toxicologia_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_toxicologia_timestamp ON evaluaciones_toxicologicas;
CREATE TRIGGER trg_update_toxicologia_timestamp
BEFORE UPDATE ON evaluaciones_toxicologicas
FOR EACH ROW EXECUTE FUNCTION update_toxicologia_timestamp();

-- 6. Trigger para actualizar updated_at en referencias
CREATE OR REPLACE FUNCTION update_referencias_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_referencias_timestamp ON referencias_candidato;
CREATE TRIGGER trg_update_referencias_timestamp
BEFORE UPDATE ON referencias_candidato
FOR EACH ROW EXECUTE FUNCTION update_referencias_timestamp();

-- 7. Insertar nuevos feature flags
INSERT INTO supply_feature_flags (flag_key, flag_value, description) VALUES
('REQUIRE_PSYCHOMETRIC_EVALUATION', false, 'Requiere evaluación psicométrica verde o ámbar aprobada para liberar'),
('REQUIRE_TOXICOLOGY_NEGATIVE', false, 'Requiere toxicología negativa para liberar'),
('REQUIRE_REFERENCES_VALIDATION', false, 'Requiere 4 referencias positivas para liberar')
ON CONFLICT (flag_key) DO NOTHING;

-- 8. RLS para evaluaciones_psicometricas
ALTER TABLE evaluaciones_psicometricas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_psicometricos" ON evaluaciones_psicometricas FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
));

CREATE POLICY "insert_psicometricos" ON evaluaciones_psicometricas FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
));

CREATE POLICY "update_psicometricos" ON evaluaciones_psicometricas FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
));

-- 9. RLS para evaluaciones_toxicologicas
ALTER TABLE evaluaciones_toxicologicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_toxicologicos" ON evaluaciones_toxicologicas FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
));

CREATE POLICY "insert_toxicologicos" ON evaluaciones_toxicologicas FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
));

CREATE POLICY "update_toxicologicos" ON evaluaciones_toxicologicas FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin')
));

-- 10. RLS para referencias_candidato
ALTER TABLE referencias_candidato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_referencias" ON referencias_candidato FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones')
));

CREATE POLICY "insert_referencias" ON referencias_candidato FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
));

CREATE POLICY "update_referencias" ON referencias_candidato FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead')
));

CREATE POLICY "delete_referencias" ON referencias_candidato FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'supply_admin')
));

-- 11. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_psicometricos_candidato ON evaluaciones_psicometricas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_psicometricos_semaforo ON evaluaciones_psicometricas(resultado_semaforo);
CREATE INDEX IF NOT EXISTS idx_psicometricos_aval_pendiente ON evaluaciones_psicometricas(aval_decision) WHERE aval_decision = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_toxicologicos_candidato ON evaluaciones_toxicologicas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_toxicologicos_resultado ON evaluaciones_toxicologicas(resultado);

CREATE INDEX IF NOT EXISTS idx_referencias_candidato ON referencias_candidato(candidato_id);
CREATE INDEX IF NOT EXISTS idx_referencias_tipo ON referencias_candidato(tipo_referencia);
CREATE INDEX IF NOT EXISTS idx_referencias_resultado ON referencias_candidato(resultado);

-- 12. Vista consolidada de evaluaciones
CREATE OR REPLACE VIEW v_candidato_evaluaciones_completas AS
SELECT 
  c.id,
  c.nombre,
  c.estado_proceso,
  c.estado_detallado,
  
  -- Entrevista (última)
  e.rating_promedio as entrevista_rating,
  e.decision as entrevista_decision,
  
  -- Riesgo
  r.risk_level,
  r.risk_score,
  
  -- Psicométricos (último)
  p.score_global as psicometrico_score,
  p.resultado_semaforo,
  p.aval_decision as psicometrico_aval,
  
  -- Toxicología (último)
  t.resultado as toxicologia_resultado,
  
  -- Referencias conteo
  (SELECT COUNT(*) FROM referencias_candidato 
   WHERE candidato_id = c.id AND tipo_referencia = 'laboral' AND resultado = 'positiva') as refs_laborales_ok,
  (SELECT COUNT(*) FROM referencias_candidato 
   WHERE candidato_id = c.id AND tipo_referencia = 'personal' AND resultado = 'positiva') as refs_personales_ok,
  
  -- Estado de evaluación completo
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