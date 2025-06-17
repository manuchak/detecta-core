
-- Primero, eliminar el constraint existente si existe
ALTER TABLE servicios_monitoreo DROP CONSTRAINT IF EXISTS servicios_monitoreo_estado_general_check;

-- Crear un nuevo constraint que incluya todos los estados del workflow
ALTER TABLE servicios_monitoreo 
ADD CONSTRAINT servicios_monitoreo_estado_general_check 
CHECK (estado_general IN (
    'pendiente_evaluacion',
    'pendiente_analisis_riesgo', 
    'rechazado_coordinador',
    'requiere_aclaracion_cliente',
    'aprobado',
    'rechazado_seguridad',
    'instalacion_programada',
    'instalacion_completada',
    'activo',
    'suspendido',
    'cancelado'
));

-- Ahora ejecutar la reparación de servicios con estados incorrectos
WITH servicios_a_reparar AS (
  SELECT 
    sm.id as servicio_id,
    sm.numero_servicio,
    sm.estado_general as estado_actual,
    ac.estado_aprobacion
  FROM servicios_monitoreo sm
  JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
  WHERE ac.estado_aprobacion = 'aprobado' 
    AND sm.estado_general != 'pendiente_analisis_riesgo'
)
UPDATE servicios_monitoreo 
SET estado_general = 'pendiente_analisis_riesgo'
WHERE id IN (SELECT servicio_id FROM servicios_a_reparar);

-- Reparar servicios rechazados
WITH servicios_rechazados AS (
  SELECT 
    sm.id as servicio_id,
    sm.numero_servicio,
    ac.estado_aprobacion
  FROM servicios_monitoreo sm
  JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
  WHERE ac.estado_aprobacion = 'rechazado' 
    AND sm.estado_general != 'rechazado_coordinador'
)
UPDATE servicios_monitoreo 
SET estado_general = 'rechazado_coordinador'
WHERE id IN (SELECT servicio_id FROM servicios_rechazados);

-- Reparar servicios que requieren aclaración
WITH servicios_aclaracion AS (
  SELECT 
    sm.id as servicio_id,
    sm.numero_servicio,
    ac.estado_aprobacion
  FROM servicios_monitoreo sm
  JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
  WHERE ac.estado_aprobacion = 'requiere_aclaracion' 
    AND sm.estado_general != 'requiere_aclaracion_cliente'
)
UPDATE servicios_monitoreo 
SET estado_general = 'requiere_aclaracion_cliente'
WHERE id IN (SELECT servicio_id FROM servicios_aclaracion);

-- Verificar que todo se reparó correctamente
SELECT 
  sm.numero_servicio,
  sm.estado_general,
  sm.nombre_cliente,
  ac.estado_aprobacion,
  ac.fecha_respuesta,
  CASE 
    WHEN ac.estado_aprobacion = 'aprobado' AND sm.estado_general = 'pendiente_analisis_riesgo' THEN 'CORRECTO ✓'
    WHEN ac.estado_aprobacion = 'rechazado' AND sm.estado_general = 'rechazado_coordinador' THEN 'CORRECTO ✓'
    WHEN ac.estado_aprobacion = 'requiere_aclaracion' AND sm.estado_general = 'requiere_aclaracion_cliente' THEN 'CORRECTO ✓'
    ELSE 'PROBLEMA - Estado inconsistente'
  END as verificacion
FROM servicios_monitoreo sm
JOIN aprobacion_coordinador ac ON sm.id = ac.servicio_id
ORDER BY ac.fecha_respuesta DESC;
