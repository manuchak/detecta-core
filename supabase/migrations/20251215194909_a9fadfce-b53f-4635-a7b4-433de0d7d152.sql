-- =============================================
-- Sprint B: Auto-asignación y configuración de horarios
-- =============================================

-- 1. Tabla de configuración de horario laboral
CREATE TABLE IF NOT EXISTS public.ticket_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  hora_inicio TIME NOT NULL DEFAULT '09:00:00',
  hora_fin TIME NOT NULL DEFAULT '18:00:00',
  es_dia_laboral BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dia_semana)
);

-- Insertar configuración por defecto (L-V 9-18)
INSERT INTO public.ticket_business_hours (dia_semana, hora_inicio, hora_fin, es_dia_laboral) VALUES
(0, '09:00:00', '18:00:00', false), -- Domingo
(1, '09:00:00', '18:00:00', true),  -- Lunes
(2, '09:00:00', '18:00:00', true),  -- Martes
(3, '09:00:00', '18:00:00', true),  -- Miércoles
(4, '09:00:00', '18:00:00', true),  -- Jueves
(5, '09:00:00', '18:00:00', true),  -- Viernes
(6, '09:00:00', '18:00:00', false)  -- Sábado
ON CONFLICT (dia_semana) DO NOTHING;

-- 2. Vista de carga de trabajo por agente
CREATE OR REPLACE VIEW public.v_ticket_agent_workload AS
SELECT 
  p.id AS agent_id,
  p.display_name,
  p.email,
  ur.role,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status IN ('abierto', 'en_progreso')), 0) AS tickets_activos,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'abierto'), 0) AS tickets_abiertos,
  COALESCE(COUNT(t.id) FILTER (WHERE t.status = 'en_progreso'), 0) AS tickets_en_progreso,
  COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600) FILTER (WHERE t.status IN ('abierto', 'en_progreso')), 0)::NUMERIC(10,2) AS avg_age_hours
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id AND ur.is_active = true
LEFT JOIN tickets t ON t.assigned_to = p.id AND t.status IN ('abierto', 'en_progreso')
WHERE ur.role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'soporte')
GROUP BY p.id, p.display_name, p.email, ur.role
ORDER BY tickets_activos ASC, p.display_name;

-- 3. Función para calcular horas laborales entre dos fechas
CREATE OR REPLACE FUNCTION public.calculate_business_hours(
  p_start TIMESTAMP WITH TIME ZONE,
  p_end TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
DECLARE
  v_current TIMESTAMP WITH TIME ZONE;
  v_total_minutes INTEGER := 0;
  v_day_start TIME;
  v_day_end TIME;
  v_is_workday BOOLEAN;
  v_holiday_count INTEGER;
BEGIN
  v_current := p_start;
  
  WHILE v_current < p_end LOOP
    -- Get business hours for this day of week
    SELECT hora_inicio, hora_fin, es_dia_laboral
    INTO v_day_start, v_day_end, v_is_workday
    FROM ticket_business_hours
    WHERE dia_semana = EXTRACT(DOW FROM v_current);
    
    -- Check if it's a holiday
    SELECT COUNT(*) INTO v_holiday_count
    FROM calendario_feriados_mx
    WHERE fecha = v_current::DATE AND activo = true;
    
    IF v_is_workday AND v_holiday_count = 0 THEN
      -- Add working hours for this day
      IF v_current::TIME < v_day_start THEN
        -- Before work hours, start from work start
        v_total_minutes := v_total_minutes + 
          EXTRACT(EPOCH FROM (LEAST(p_end, v_current::DATE + v_day_end) - (v_current::DATE + v_day_start))) / 60;
      ELSIF v_current::TIME >= v_day_start AND v_current::TIME < v_day_end THEN
        -- During work hours
        v_total_minutes := v_total_minutes + 
          EXTRACT(EPOCH FROM (LEAST(p_end, v_current::DATE + v_day_end) - v_current)) / 60;
      END IF;
    END IF;
    
    -- Move to next day
    v_current := (v_current::DATE + 1) + v_day_start;
  END LOOP;
  
  RETURN GREATEST(0, v_total_minutes);
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 4. Función para obtener el agente con menor carga por departamento
CREATE OR REPLACE FUNCTION public.get_least_loaded_agent(
  p_departamento VARCHAR
) RETURNS UUID AS $$
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
    'admin', 'owner' -- Admins can handle any department
  )
  ORDER BY tickets_activos ASC, avg_age_hours ASC
  LIMIT 1;
  
  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 5. Función para auto-asignar ticket y calcular SLA con horario laboral
CREATE OR REPLACE FUNCTION public.auto_assign_and_set_sla()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id UUID;
  v_departamento VARCHAR;
  v_sla_respuesta INTEGER;
  v_sla_resolucion INTEGER;
  v_sla_respuesta_date TIMESTAMP WITH TIME ZONE;
  v_sla_resolucion_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get department from category
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
  
  -- Auto-assign if not already assigned
  IF NEW.assigned_to IS NULL THEN
    v_agent_id := get_least_loaded_agent(v_departamento);
    IF v_agent_id IS NOT NULL THEN
      NEW.assigned_to := v_agent_id;
    END IF;
  END IF;
  
  -- Calculate SLA deadlines using business hours
  -- For simplicity, add business hours (will be calculated more precisely in frontend)
  v_sla_respuesta_date := NEW.created_at + (v_sla_respuesta || ' hours')::INTERVAL;
  v_sla_resolucion_date := NEW.created_at + (v_sla_resolucion || ' hours')::INTERVAL;
  
  -- Skip weekends for SLA
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
$$ LANGUAGE plpgsql SET search_path = public;

-- 6. Crear trigger para auto-asignación
DROP TRIGGER IF EXISTS trg_auto_assign_ticket ON tickets;
CREATE TRIGGER trg_auto_assign_ticket
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_and_set_sla();

-- 7. RLS policies
ALTER TABLE public.ticket_business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view business hours"
  ON public.ticket_business_hours FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage business hours"
  ON public.ticket_business_hours FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner') 
      AND is_active = true
    )
  );

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tickets_categoria_status ON tickets(categoria_custodio_id, status);