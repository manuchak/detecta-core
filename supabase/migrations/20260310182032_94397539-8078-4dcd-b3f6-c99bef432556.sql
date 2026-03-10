
-- 1. Create trigger function to auto-deactivate assignments when service completes
CREATE OR REPLACE FUNCTION fn_cleanup_assignment_on_complete()
RETURNS trigger AS $$
BEGIN
  IF (
    NEW.estado_planeacion IN ('completado', 'cancelado')
    OR (NEW.hora_fin_real IS NOT NULL AND OLD.hora_fin_real IS NULL)
  ) THEN
    UPDATE bitacora_asignaciones_monitorista
    SET activo = false, fin_turno = now()
    WHERE servicio_id = NEW.id_servicio AND activo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on servicios_planificados
DROP TRIGGER IF EXISTS cleanup_assignment_on_complete ON servicios_planificados;
CREATE TRIGGER cleanup_assignment_on_complete
AFTER UPDATE ON servicios_planificados
FOR EACH ROW
EXECUTE FUNCTION fn_cleanup_assignment_on_complete();

-- 3. Clean up existing orphaned assignments (active assignments for completed services)
UPDATE bitacora_asignaciones_monitorista
SET activo = false, fin_turno = now()
WHERE activo = true
  AND servicio_id IN (
    SELECT id_servicio
    FROM servicios_planificados
    WHERE estado_planeacion IN ('completado', 'cancelado')
       OR hora_fin_real IS NOT NULL
  );
