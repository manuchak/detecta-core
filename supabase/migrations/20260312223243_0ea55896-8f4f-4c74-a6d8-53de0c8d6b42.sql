UPDATE lms_contenidos 
SET contenido = contenido || '{"intentos_permitidos": 3, "puntuacion_minima": 80, "mostrar_respuestas_correctas": true}'::jsonb
WHERE tipo = 'quiz' 
  AND (contenido->>'intentos_permitidos' IS NULL);