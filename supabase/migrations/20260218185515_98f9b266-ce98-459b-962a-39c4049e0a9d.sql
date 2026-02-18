
-- Function: When an incidente_operativo is created/updated with coordinates,
-- insert a corresponding security_event and flag for zone recalculation
CREATE OR REPLACE FUNCTION public.sync_incident_to_security_event()
RETURNS TRIGGER AS $$
DECLARE
  v_h3_index TEXT;
  v_severity TEXT;
BEGIN
  -- Only proceed if incident has coordinates
  IF NEW.ubicacion_lat IS NULL OR NEW.ubicacion_lng IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map incident severity to security event severity
  v_severity := CASE lower(NEW.severidad)
    WHEN 'critica' THEN 'critico'
    WHEN 'crítica' THEN 'critico'
    WHEN 'alta' THEN 'alto'
    WHEN 'media' THEN 'medio'
    WHEN 'baja' THEN 'bajo'
    ELSE 'medio'
  END;

  -- Generate a simple H3-like index from coordinates (resolution ~6 approximation)
  -- Real H3 would be calculated via edge function, this is a deterministic placeholder
  v_h3_index := '86' || lpad(floor(((NEW.ubicacion_lat + 90) / 180) * 1000000)::text, 7, '0') 
                      || lpad(floor(((NEW.ubicacion_lng + 180) / 360) * 1000000)::text, 7, '0');

  -- Insert security event (upsert by incident id to avoid duplicates)
  INSERT INTO public.security_events (
    h3_index, event_type, severity, event_date, description, source, 
    reported_by, verified, lat, lng
  ) VALUES (
    v_h3_index,
    NEW.tipo,
    v_severity,
    NEW.fecha_incidente::date,
    left(NEW.descripcion, 500),
    'operativo',
    NEW.reportado_por,
    true,
    NEW.ubicacion_lat,
    NEW.ubicacion_lng
  )
  ON CONFLICT DO NOTHING;

  -- Log to risk_zone_history
  INSERT INTO public.risk_zone_history (
    h3_index, change_type, change_reason, changed_by
  ) VALUES (
    v_h3_index,
    'event_added',
    'Incidente operativo: ' || NEW.tipo || ' (' || NEW.severidad || ')',
    NEW.reportado_por
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on incidentes_operativos
DROP TRIGGER IF EXISTS trg_sync_incident_security ON public.incidentes_operativos;
CREATE TRIGGER trg_sync_incident_security
  AFTER INSERT OR UPDATE OF ubicacion_lat, ubicacion_lng, severidad
  ON public.incidentes_operativos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_incident_to_security_event();
