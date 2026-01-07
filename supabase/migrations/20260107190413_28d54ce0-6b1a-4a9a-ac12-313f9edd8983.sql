-- Corregir timestamps de servicios planificados
-- Los datos fueron guardados sin offset CDMX, necesitan +6 horas para reflejar UTC correcto
-- Ejemplo: Usuario ingresó 7:00 AM CDMX → Sistema guardó 08:00 UTC → Debería ser 13:00 UTC

UPDATE servicios_planificados
SET fecha_hora_cita = fecha_hora_cita + INTERVAL '6 hours'
WHERE 
  -- Solo servicios creados antes de la corrección del código (hoy ~19:00 UTC)
  created_at < '2026-01-07T19:00:00+00'
  -- Solo servicios recientes/futuros
  AND fecha_hora_cita >= '2026-01-01'
  -- Excluir servicios finalizados para preservar histórico
  AND estado_planeacion NOT IN ('completado', 'finalizado');