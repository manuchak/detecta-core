-- Eliminar validaciones estrictas de fecha y agregar lógica de cancelación automática
-- Primero, necesitamos permitir reprogramar instalaciones vencidas

-- Crear trigger para manejar instalaciones vencidas
CREATE OR REPLACE FUNCTION handle_expired_installations()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la fecha programada ya pasó y el estado es 'programada', cambiar a 'cancelada'
  IF NEW.fecha_programada < now() AND NEW.estado = 'programada' THEN
    NEW.estado := 'cancelada';
    NEW.observaciones_cliente := COALESCE(NEW.observaciones_cliente, '') || ' [CANCELADA AUTOMÁTICAMENTE: Fecha vencida]';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute antes de actualizar
DROP TRIGGER IF EXISTS trigger_handle_expired_installations ON programacion_instalaciones;
CREATE TRIGGER trigger_handle_expired_installations
  BEFORE INSERT OR UPDATE ON programacion_instalaciones
  FOR EACH ROW
  EXECUTE FUNCTION handle_expired_installations();

-- Actualizar instalaciones existentes que ya están vencidas
UPDATE programacion_instalaciones 
SET 
  estado = 'cancelada',
  observaciones_cliente = COALESCE(observaciones_cliente, '') || ' [CANCELADA AUTOMÁTICAMENTE: Fecha vencida]'
WHERE fecha_programada < now() 
  AND estado = 'programada';

-- Crear función para permitir reprogramar instalaciones
CREATE OR REPLACE FUNCTION allow_reschedule_installation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si están actualizando la fecha de una instalación cancelada por vencimiento,
  -- permitir cambiar el estado de vuelta a 'programada'
  IF OLD.estado = 'cancelada' 
     AND NEW.fecha_programada > now() + interval '72 hours'
     AND EXTRACT(dow FROM NEW.fecha_programada) NOT IN (0, 6) -- No domingo (0) ni sábado (6)
  THEN
    NEW.estado := 'programada';
    -- Limpiar mensaje de cancelación automática
    NEW.observaciones_cliente := REPLACE(
      COALESCE(NEW.observaciones_cliente, ''), 
      ' [CANCELADA AUTOMÁTICAMENTE: Fecha vencida]', 
      ''
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para permitir reprogramación
DROP TRIGGER IF EXISTS trigger_allow_reschedule ON programacion_instalaciones;
CREATE TRIGGER trigger_allow_reschedule
  BEFORE UPDATE ON programacion_instalaciones
  FOR EACH ROW
  EXECUTE FUNCTION allow_reschedule_installation();