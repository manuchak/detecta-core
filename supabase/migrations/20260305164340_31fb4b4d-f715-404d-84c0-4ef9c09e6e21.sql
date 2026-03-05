
-- Update Oscar Patiño's phone number in custodios_operativos
UPDATE custodios_operativos
SET telefono = '4462888724', updated_at = now()
WHERE id = '94075138-694c-4900-9dae-87cfba8be05a';

-- Update future planned services
UPDATE servicios_planificados
SET custodio_telefono = '4462888724'
WHERE custodio_telefono = '4421862382'
  AND fecha_hora_cita >= now()
  AND estado_planeacion NOT IN ('cancelado', 'completado', 'finalizado');
