
-- Paso 1: Normalizar registros en asignacion_armados que usan UUID en vez de id_servicio
-- Actualizar los registros cuyo servicio_custodia_id es un UUID que existe en servicios_planificados.id
UPDATE asignacion_armados aa
SET servicio_custodia_id = sp.id_servicio
FROM servicios_planificados sp
WHERE aa.servicio_custodia_id = sp.id::text
  AND aa.servicio_custodia_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Paso 2: Crear indice en servicio_custodia_id si no existe
CREATE INDEX IF NOT EXISTS idx_asignacion_armados_servicio_custodia_id 
ON asignacion_armados(servicio_custodia_id);
