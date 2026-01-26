-- Actualizar zona_base de custodios operativos con datos de ubicación de entrevista
-- Usa custodio_liberacion para hacer el join correcto
UPDATE custodios_operativos co
SET zona_base = e.nombre,
    updated_at = now()
FROM custodio_liberacion cl
JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
JOIN leads l ON l.candidato_custodio_id = cc.id
JOIN estados e ON e.id::text = (l.last_interview_data->'ubicacion'->>'estado_id')
WHERE co.pc_custodio_id = cl.pc_custodio_id
  AND cl.pc_custodio_id IS NOT NULL
  AND l.last_interview_data->'ubicacion'->>'estado_id' IS NOT NULL
  AND l.last_interview_data->'ubicacion'->>'estado_id' != ''
  AND co.zona_base != e.nombre;