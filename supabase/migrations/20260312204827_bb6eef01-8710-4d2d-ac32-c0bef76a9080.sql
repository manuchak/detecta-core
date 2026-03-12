-- Trigger: auto-complete armado assignments when service is finalized
CREATE OR REPLACE FUNCTION sync_armado_estado_on_servicio_finalizado()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'Finalizado' AND OLD.estado IS DISTINCT FROM 'Finalizado' THEN
    UPDATE asignacion_armados
    SET estado_asignacion = 'completado',
        updated_at = NOW()
    WHERE servicio_custodia_id = NEW.id_servicio
      AND estado_asignacion IN ('pendiente', 'confirmado', 'en_curso', 'asignado', 'en_ruta')
      AND tipo_asignacion = 'interno';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_armado_estado_on_finalizado
AFTER UPDATE ON servicios_custodia
FOR EACH ROW
WHEN (NEW.estado = 'Finalizado' AND OLD.estado IS DISTINCT FROM 'Finalizado')
EXECUTE FUNCTION sync_armado_estado_on_servicio_finalizado();