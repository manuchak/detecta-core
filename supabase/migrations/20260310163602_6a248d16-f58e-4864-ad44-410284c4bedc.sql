-- Layer 3: Immediate cleanup — keep only the most recent active assignment per service
DELETE FROM bitacora_asignaciones_monitorista 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY servicio_id ORDER BY created_at DESC) as rn
    FROM bitacora_asignaciones_monitorista 
    WHERE activo = true
  ) sub WHERE rn > 1
);

-- Layer 1: Unique partial index to prevent duplicate active assignments
CREATE UNIQUE INDEX idx_unique_active_assignment 
ON bitacora_asignaciones_monitorista (servicio_id) 
WHERE activo = true;