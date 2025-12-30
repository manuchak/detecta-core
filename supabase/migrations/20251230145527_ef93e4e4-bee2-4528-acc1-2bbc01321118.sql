-- Cancelar el servicio duplicado de TRICORP que sigue apareciendo como planificado
UPDATE servicios_planificados 
SET estado_planeacion = 'cancelado'
WHERE id = '670a8e1d-ad44-471e-868b-46138822cfa9'
  AND nombre_cliente = 'TRICORP'
  AND estado_planeacion = 'planificado';