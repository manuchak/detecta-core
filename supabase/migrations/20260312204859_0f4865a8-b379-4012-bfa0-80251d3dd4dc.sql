-- Backfill: mark armado assignments as completed for already-finalized services
UPDATE asignacion_armados aa
SET estado_asignacion = 'completado', updated_at = NOW()
FROM servicios_custodia sc
WHERE aa.servicio_custodia_id = sc.id_servicio
  AND sc.estado = 'Finalizado'
  AND aa.estado_asignacion IN ('pendiente', 'confirmado', 'asignado')
  AND aa.tipo_asignacion = 'interno';