
-- 1. Modify the auto_assign_and_set_sla trigger to always assign to Daniela Castañeda
CREATE OR REPLACE FUNCTION public.auto_assign_and_set_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daniela_id uuid := 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca';
  v_sla_hours integer;
  v_sla_deadline timestamptz;
BEGIN
  -- Always assign to Daniela if not already assigned
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := v_daniela_id;
  END IF;

  -- Calculate SLA deadline based on priority
  v_sla_hours := CASE NEW.priority
    WHEN 'urgente' THEN 2
    WHEN 'alta' THEN 4
    WHEN 'media' THEN 8
    WHEN 'baja' THEN 24
    ELSE 8
  END;

  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := NOW() + (v_sla_hours || ' hours')::interval;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill: reassign ALL existing tickets to Daniela
UPDATE public.tickets
SET assigned_to = 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca',
    updated_at = NOW()
WHERE assigned_to IS DISTINCT FROM 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca';
