-- Function to update fecha_ultimo_servicio when armado is assigned
CREATE OR REPLACE FUNCTION public.sync_armado_fecha_ultimo_servicio()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if armado_asignado is not null
  IF NEW.armado_asignado IS NOT NULL AND NEW.armado_asignado != '' THEN
    -- Update fecha_ultimo_servicio for the matching armado
    UPDATE armados_operativos
    SET 
      fecha_ultimo_servicio = GREATEST(
        COALESCE(fecha_ultimo_servicio, '1900-01-01'::timestamp),
        NEW.fecha_hora_cita
      ),
      updated_at = NOW()
    WHERE UPPER(TRIM(nombre)) = UPPER(TRIM(NEW.armado_asignado))
      AND NEW.estado_planeacion IN ('confirmado', 'completado', 'en_curso', 'pendiente');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on servicios_planificados
DROP TRIGGER IF EXISTS trigger_sync_armado_fecha_servicio ON servicios_planificados;

CREATE TRIGGER trigger_sync_armado_fecha_servicio
AFTER INSERT OR UPDATE OF armado_asignado, fecha_hora_cita, estado_planeacion
ON servicios_planificados
FOR EACH ROW
EXECUTE FUNCTION public.sync_armado_fecha_ultimo_servicio();

-- Also sync existing data now
UPDATE armados_operativos ao
SET fecha_ultimo_servicio = subquery.ultima_fecha, updated_at = NOW()
FROM (
  SELECT 
    ao2.id as armado_id,
    MAX(sp.fecha_hora_cita) as ultima_fecha
  FROM armados_operativos ao2
  INNER JOIN servicios_planificados sp 
    ON UPPER(TRIM(sp.armado_asignado)) = UPPER(TRIM(ao2.nombre))
  WHERE sp.fecha_hora_cita <= NOW()
    AND sp.estado_planeacion IN ('confirmado', 'completado', 'en_curso', 'pendiente')
  GROUP BY ao2.id
) subquery
WHERE ao.id = subquery.armado_id
  AND (ao.fecha_ultimo_servicio IS NULL OR subquery.ultima_fecha > ao.fecha_ultimo_servicio);