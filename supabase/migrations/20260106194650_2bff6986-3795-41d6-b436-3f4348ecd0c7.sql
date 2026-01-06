-- CURSO DE PRUEBA: Onboarding Custodia Vehicular

-- 1. Insertar el curso principal
INSERT INTO public.lms_cursos (
  codigo, titulo, descripcion, categoria, nivel, duracion_estimada_min,
  plazo_dias_default, es_obligatorio, roles_objetivo, publicado, activo, orden
) VALUES (
  'ONB-CUST-001',
  'Onboarding Custodia Vehicular',
  'Programa de inducción completo para custodios vehiculares. Aprenderás los protocolos de seguridad, responsabilidades del rol y uso de herramientas tecnológicas.',
  'onboarding', 'basico', 45, 30, true, ARRAY['custodio'], true, true, 1
);

-- 2. Insertar módulos
INSERT INTO public.lms_modulos (curso_id, titulo, descripcion, orden, activo)
SELECT c.id, 'Introducción a Detecta', 'Conoce nuestra empresa, misión, valores y estructura.', 1, true
FROM public.lms_cursos c WHERE c.codigo = 'ONB-CUST-001';

INSERT INTO public.lms_modulos (curso_id, titulo, descripcion, orden, activo)
SELECT c.id, 'Responsabilidades del Custodio', 'Entiende tu rol y funciones principales.', 2, true
FROM public.lms_cursos c WHERE c.codigo = 'ONB-CUST-001';

INSERT INTO public.lms_modulos (curso_id, titulo, descripcion, orden, activo)
SELECT c.id, 'Uso de la App Móvil', 'Domina las herramientas tecnológicas.', 3, true
FROM public.lms_cursos c WHERE c.codigo = 'ONB-CUST-001';

-- 3. Contenidos Módulo 1 (tipos: texto_enriquecido, video)
INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Bienvenida a Detecta', 'texto_enriquecido',
  '{"html": "<h2>¡Bienvenido al equipo Detecta!</h2><p>Nos dedicamos a proteger lo que más importa.</p><h3>Valores</h3><ul><li>Seguridad</li><li>Profesionalismo</li><li>Compromiso</li><li>Innovación</li></ul>"}'::jsonb,
  1, 3, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 1;

INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Video: Presentación de la Empresa', 'video',
  '{"url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "provider": "youtube"}'::jsonb,
  2, 7, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 1;

-- 4. Contenidos Módulo 2 (tipos: documento, quiz)
INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Manual de Funciones', 'documento',
  '{"url": "https://example.com/manual.pdf", "filename": "manual-custodio.pdf"}'::jsonb,
  1, 10, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 2;

INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Evaluación: Responsabilidades', 'quiz',
  '{"passing_score": 80, "max_attempts": 3, "questions": [
    {"id": "q1", "question": "¿Cuál es la principal responsabilidad?", "type": "single", "options": [
      {"id": "a", "text": "Conducir el vehículo", "isCorrect": false},
      {"id": "b", "text": "Proteger al cliente y bienes", "isCorrect": true},
      {"id": "c", "text": "Reparaciones mecánicas", "isCorrect": false}
    ]},
    {"id": "q2", "question": "¿Qué hacer ante riesgo?", "type": "single", "options": [
      {"id": "a", "text": "Ignorar", "isCorrect": false},
      {"id": "b", "text": "Reportar inmediatamente", "isCorrect": true},
      {"id": "c", "text": "Esperar", "isCorrect": false}
    ]}
  ]}'::jsonb,
  2, 10, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 2;

-- 5. Contenidos Módulo 3 (tipos: video, interactivo)
INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Tutorial: App Detecta', 'video',
  '{"url": "https://www.youtube.com/embed/dQw4w9WgXcQ", "provider": "youtube"}'::jsonb,
  1, 8, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 3;

INSERT INTO public.lms_contenidos (modulo_id, titulo, tipo, contenido, orden, duracion_min, activo)
SELECT m.id, 'Flashcards: Funciones App', 'interactivo',
  '{"subtype": "flashcards", "cards": [
    {"id": "f1", "front": "🚨 Botón de Pánico", "back": "Activa alerta inmediata a central."},
    {"id": "f2", "front": "📍 Check-in", "back": "Registra tu posición actual."},
    {"id": "f3", "front": "📷 Reportar Incidente", "back": "Documenta novedades con fotos."},
    {"id": "f4", "front": "💬 Chat Central", "back": "Comunicación 24/7 con operadores."}
  ]}'::jsonb,
  2, 7, true
FROM public.lms_modulos m JOIN public.lms_cursos c ON m.curso_id = c.id
WHERE c.codigo = 'ONB-CUST-001' AND m.orden = 3;