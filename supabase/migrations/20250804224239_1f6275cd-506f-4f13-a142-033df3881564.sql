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