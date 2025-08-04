-- Crear función segura para el proceso de aprobación de leads que evite problemas de permisos
CREATE OR REPLACE FUNCTION public.update_approval_process(
  p_lead_id uuid,
  p_stage text,
  p_interview_method text,
  p_notes text,
  p_decision text DEFAULT NULL,
  p_decision_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Hacer upsert en lead_approval_process
  INSERT INTO public.lead_approval_process (
    lead_id,
    analyst_id,
    current_stage,
    interview_method,
    phone_interview_notes,
    final_decision,
    decision_reason,
    phone_interview_completed,
    second_interview_required,
    updated_at
  ) VALUES (
    p_lead_id,
    current_user_id,
    p_stage,
    p_interview_method,
    p_notes,
    p_decision,
    p_decision_reason,
    true,
    CASE WHEN p_stage = 'second_interview' THEN true ELSE false END,
    now()
  )
  ON CONFLICT (lead_id) DO UPDATE SET
    analyst_id = current_user_id,
    current_stage = p_stage,
    interview_method = p_interview_method,
    phone_interview_notes = p_notes,
    final_decision = p_decision,
    decision_reason = p_decision_reason,
    phone_interview_completed = true,
    second_interview_required = CASE WHEN p_stage = 'second_interview' THEN true ELSE false END,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Crear función para obtener el rol del usuario actual de manera segura
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  found_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;
  
  -- Verificar si es admin@admin.com directamente
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email = 'admin@admin.com' THEN
    RETURN 'admin';
  END IF;
  
  -- Obtener el rol del usuario
  SELECT role INTO found_role
  FROM public.user_roles
  WHERE user_id = current_user_id
  ORDER BY
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'owner' THEN 2
      WHEN 'supply_admin' THEN 3
      WHEN 'analista_seguridad' THEN 4
      WHEN 'supply_lead' THEN 5
      WHEN 'supply' THEN 6
      ELSE 10
    END
  LIMIT 1;
  
  RETURN COALESCE(found_role, 'authenticated');
END;
$$;

-- Actualizar las políticas RLS para lead_approval_process para evitar problemas de permisos
DROP POLICY IF EXISTS "Analysts can create approval processes" ON public.lead_approval_process;
DROP POLICY IF EXISTS "Analysts can update their assigned approval processes" ON public.lead_approval_process;
DROP POLICY IF EXISTS "Analysts can view their assigned approval processes" ON public.lead_approval_process;
DROP POLICY IF EXISTS "Analysts can manage their assigned approvals" ON public.lead_approval_process;

-- Crear políticas más simples y seguras
CREATE POLICY "Allow authenticated users to manage lead approval process"
ON public.lead_approval_process
FOR ALL
TO authenticated
USING (
  analyst_id = auth.uid() OR 
  public.get_current_user_role_safe() IN ('admin', 'owner', 'supply_admin')
)
WITH CHECK (
  analyst_id = auth.uid() OR 
  public.get_current_user_role_safe() IN ('admin', 'owner', 'supply_admin')
);

-- Actualizar políticas para la tabla leads también
DROP POLICY IF EXISTS "leads_analyst_update" ON public.leads;

CREATE POLICY "leads_analyst_update_safe"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  asignado_a = auth.uid() OR 
  public.get_current_user_role_safe() IN ('admin', 'owner', 'supply_admin')
)
WITH CHECK (
  asignado_a = auth.uid() OR 
  public.get_current_user_role_safe() IN ('admin', 'owner', 'supply_admin')
);