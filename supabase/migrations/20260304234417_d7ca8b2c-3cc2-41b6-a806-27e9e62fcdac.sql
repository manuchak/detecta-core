CREATE OR REPLACE FUNCTION public.auto_assign_and_set_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_daniela_id uuid := 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca';
  v_sla_hours integer;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := v_daniela_id;
  END IF;

  v_sla_hours := CASE NEW.priority
    WHEN 'urgente' THEN 2
    WHEN 'alta' THEN 4
    WHEN 'media' THEN 8
    WHEN 'baja' THEN 24
    ELSE 8
  END;

  IF NEW.fecha_sla_respuesta IS NULL THEN
    NEW.fecha_sla_respuesta := NOW() + (v_sla_hours || ' hours')::interval;
  END IF;

  IF NEW.fecha_sla_resolucion IS NULL THEN
    NEW.fecha_sla_resolucion := NOW() + ((v_sla_hours * 3) || ' hours')::interval;
  END IF;

  RETURN NEW;
END;
$function$;