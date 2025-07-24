-- Corregir el trigger de métricas de retención para resolver error de tipo
CREATE OR REPLACE FUNCTION public.update_retention_metrics_on_service_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo proceder si el servicio se marca como completado/finalizado
  IF NEW.estado IN ('completado', 'Completado', 'finalizado', 'Finalizado') 
     AND (OLD.estado IS NULL OR OLD.estado NOT IN ('completado', 'Completado', 'finalizado', 'Finalizado')) THEN
    
    -- Actualizar métricas de retención mensual con cast explícito a DATE
    PERFORM public.calculate_monthly_retention(DATE(NEW.fecha_hora_cita));
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;