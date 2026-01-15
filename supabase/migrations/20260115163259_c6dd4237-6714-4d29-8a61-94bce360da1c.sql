-- Corregir servicio TRICORP que fue guardado con fecha incorrecta
-- El servicio se ve como 2026-01-15 20:00:00 CDMX pero debería ser 2026-01-16
-- Necesita +6 horas para mostrar correctamente en día 16

UPDATE servicios_planificados
SET fecha_hora_cita = '2026-01-16T08:00:00-06:00'::timestamptz
WHERE id = '782d4b42-f04a-48e9-94b9-fe61c1529cbd'
  AND id_servicio = 'TRTSTIN-29';

-- Comentario: El servicio fue guardado como 02:00 UTC que es 20:00 CDMX del día anterior
-- Lo corregimos a 08:00 CDMX del día 16 (hora típica de servicio matutino)