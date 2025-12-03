-- =====================================================
-- SPRINT 4: CAPACITACIÓN E INSTALACIÓN TÉCNICA
-- =====================================================

-- 1. TABLAS DE CAPACITACIÓN
CREATE TABLE IF NOT EXISTS modulos_capacitacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  duracion_estimada_min INT DEFAULT 30,
  contenido_url TEXT,
  tipo_contenido VARCHAR(50) DEFAULT 'documento',
  activo BOOLEAN DEFAULT true,
  es_obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preguntas_quiz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES modulos_capacitacion(id) ON DELETE CASCADE,
  pregunta TEXT NOT NULL,
  opciones JSONB NOT NULL,
  explicacion TEXT,
  orden INT DEFAULT 0,
  puntos INT DEFAULT 1,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progreso_capacitacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id UUID NOT NULL REFERENCES candidatos_custodios(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES modulos_capacitacion(id) ON DELETE CASCADE,
  contenido_iniciado BOOLEAN DEFAULT false,
  contenido_completado BOOLEAN DEFAULT false,
  fecha_inicio_contenido TIMESTAMPTZ,
  fecha_completado_contenido TIMESTAMPTZ,
  tiempo_dedicado_min INT DEFAULT 0,
  quiz_iniciado BOOLEAN DEFAULT false,
  quiz_completado BOOLEAN DEFAULT false,
  quiz_intentos INT DEFAULT 0,
  quiz_mejor_puntaje DECIMAL(5,2),
  quiz_ultimo_puntaje DECIMAL(5,2),
  quiz_aprobado BOOLEAN DEFAULT false,
  fecha_primer_quiz TIMESTAMPTZ,
  fecha_aprobacion_quiz TIMESTAMPTZ,
  respuestas_ultimo_intento JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidato_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_progreso_capacitacion_candidato ON progreso_capacitacion(candidato_id);
CREATE INDEX IF NOT EXISTS idx_progreso_capacitacion_modulo ON progreso_capacitacion(modulo_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_quiz_modulo ON preguntas_quiz(modulo_id);

-- 2. FEATURE FLAGS PARA SPRINT 4
INSERT INTO supply_feature_flags (flag_key, flag_value, description)
VALUES 
  ('REQUIRE_TRAINING_COMPLETED', false, 'Requiere capacitación completa (quiz ≥80%) para liberar'),
  ('REQUIRE_INSTALLATION_VALIDATED', false, 'Requiere instalación técnica completada para liberar')
ON CONFLICT (flag_key) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW();

-- 3. RLS POLICIES (simplificado para authenticated)
ALTER TABLE modulos_capacitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_capacitacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modulos_capacitacion_authenticated" ON modulos_capacitacion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "preguntas_quiz_authenticated" ON preguntas_quiz FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "progreso_capacitacion_authenticated" ON progreso_capacitacion FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. DATOS INICIALES MÓDULOS
INSERT INTO modulos_capacitacion (codigo, nombre, descripcion, orden, duracion_estimada_min, tipo_contenido, es_obligatorio) VALUES 
  ('MOD-001', 'Introducción a la Empresa', 'Historia, misión, visión y valores', 1, 20, 'video', true),
  ('MOD-002', 'Políticas y Reglamentos', 'Normas internas y código de conducta', 2, 30, 'documento', true),
  ('MOD-003', 'Protocolos de Seguridad', 'Procedimientos operativos y emergencias', 3, 45, 'video', true),
  ('MOD-004', 'Uso de Equipos GPS', 'Operación del GPS y troubleshooting', 4, 30, 'interactivo', true),
  ('MOD-005', 'Comunicación con C4', 'Protocolos y canales de emergencia', 5, 25, 'documento', true),
  ('MOD-006', 'Servicio al Cliente', 'Trato profesional y resolución de conflictos', 6, 20, 'video', false)
ON CONFLICT (codigo) DO NOTHING;

-- 5. PREGUNTAS EJEMPLO
WITH mod AS (SELECT id FROM modulos_capacitacion WHERE codigo = 'MOD-001')
INSERT INTO preguntas_quiz (modulo_id, pregunta, opciones, explicacion, orden)
SELECT mod.id, p.pregunta, p.opciones::jsonb, p.explicacion, p.orden FROM mod,
(VALUES
  ('¿Cuál es la principal misión de la empresa?', 
   '[{"texto": "Maximizar ganancias", "es_correcta": false}, {"texto": "Brindar seguridad y tranquilidad", "es_correcta": true}, {"texto": "Vender equipos GPS", "es_correcta": false}]',
   'Nuestra misión es brindar seguridad.', 1),
  ('¿Cuál es un valor fundamental?', 
   '[{"texto": "Competitividad agresiva", "es_correcta": false}, {"texto": "Integridad y profesionalismo", "es_correcta": true}, {"texto": "Individualismo", "es_correcta": false}]',
   'La integridad es fundamental.', 2)
) AS p(pregunta, opciones, explicacion, orden)
ON CONFLICT DO NOTHING;

-- 6. VISTA DE PROGRESO
CREATE OR REPLACE VIEW v_capacitacion_progreso_candidato AS
SELECT 
  c.id as candidato_id,
  c.nombre as candidato_nombre,
  COUNT(DISTINCT m.id) as total_modulos,
  COUNT(DISTINCT CASE WHEN p.quiz_aprobado THEN m.id END) as quizzes_aprobados,
  ROUND(COUNT(DISTINCT CASE WHEN p.quiz_aprobado THEN m.id END)::DECIMAL / NULLIF(COUNT(DISTINCT m.id), 0) * 100, 2) as porcentaje_completado,
  BOOL_AND(COALESCE(p.quiz_aprobado, false)) FILTER (WHERE m.es_obligatorio) as capacitacion_completa
FROM candidatos_custodios c
CROSS JOIN modulos_capacitacion m
LEFT JOIN progreso_capacitacion p ON p.candidato_id = c.id AND p.modulo_id = m.id
WHERE m.activo = true
GROUP BY c.id, c.nombre;