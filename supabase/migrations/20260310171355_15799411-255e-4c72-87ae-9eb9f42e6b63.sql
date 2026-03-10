-- Data fix: Assign GRIAGEM-2 (GREMSA) to monitorista with lowest load
INSERT INTO bitacora_asignaciones_monitorista (servicio_id, monitorista_id, turno, inicio_turno, activo)
VALUES (
  '14758fe6-60dd-4c82-b494-729014c3383f',
  'c5a26dd7-1698-4bee-a5c0-5d45c78b9797',
  'matutino',
  now(),
  true
);