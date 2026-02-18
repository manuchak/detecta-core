
-- 1. get_least_loaded_agent -> SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_least_loaded_agent(p_departamento VARCHAR)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
BEGIN
  SELECT agent_id INTO v_agent_id
  FROM v_ticket_agent_workload
  WHERE role IN (
    CASE p_departamento
      WHEN 'finanzas' THEN 'admin'
      WHEN 'planeacion' THEN 'supply_admin'
      WHEN 'instaladores' THEN 'supply_lead'
      WHEN 'supply' THEN 'supply_admin'
      ELSE 'soporte'
    END,
    'admin', 'owner'
  )
  ORDER BY tickets_activos ASC, avg_age_hours ASC
  LIMIT 1;
  
  RETURN v_agent_id;
END;
$$;

-- 2. auto_assign_and_set_sla -> SECURITY DEFINER
CREATE OR REPLACE FUNCTION auto_assign_and_set_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_departamento VARCHAR;
  v_sla_respuesta INTEGER;
  v_sla_resolucion INTEGER;
  v_sla_respuesta_date TIMESTAMP WITH TIME ZONE;
  v_sla_resolucion_date TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NEW.categoria_custodio_id IS NOT NULL THEN
    SELECT departamento_responsable, sla_horas_respuesta, sla_horas_resolucion
    INTO v_departamento, v_sla_respuesta, v_sla_resolucion
    FROM ticket_categorias_custodio
    WHERE id = NEW.categoria_custodio_id;
  ELSE
    v_departamento := 'soporte';
    v_sla_respuesta := 24;
    v_sla_resolucion := 72;
  END IF;
  
  IF NEW.assigned_to IS NULL THEN
    v_agent_id := get_least_loaded_agent(v_departamento);
    IF v_agent_id IS NOT NULL THEN
      NEW.assigned_to := v_agent_id;
    END IF;
  END IF;
  
  v_sla_respuesta_date := NEW.created_at + (v_sla_respuesta || ' hours')::INTERVAL;
  v_sla_resolucion_date := NEW.created_at + (v_sla_resolucion || ' hours')::INTERVAL;
  
  WHILE EXTRACT(DOW FROM v_sla_respuesta_date) IN (0, 6) LOOP
    v_sla_respuesta_date := v_sla_respuesta_date + INTERVAL '1 day';
  END LOOP;
  
  WHILE EXTRACT(DOW FROM v_sla_resolucion_date) IN (0, 6) LOOP
    v_sla_resolucion_date := v_sla_resolucion_date + INTERVAL '1 day';
  END LOOP;
  
  NEW.fecha_sla_respuesta := COALESCE(NEW.fecha_sla_respuesta, v_sla_respuesta_date);
  NEW.fecha_sla_resolucion := COALESCE(NEW.fecha_sla_resolucion, v_sla_resolucion_date);
  
  RETURN NEW;
END;
$$;
