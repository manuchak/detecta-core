-- Corregir videos de Vimeo que tienen provider='youtube' incorrecto
UPDATE lms_contenidos
SET contenido = jsonb_set(contenido, '{provider}', '"vimeo"')
WHERE tipo = 'video'
AND contenido->>'url' LIKE '%vimeo.com%'
AND contenido->>'provider' = 'youtube';