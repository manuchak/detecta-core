-- Actualizar política SELECT de servicios_custodia para incluir rol planificador
DROP POLICY IF EXISTS servicios_custodia_select_admin_ops ON public.servicios_custodia;

CREATE POLICY servicios_custodia_select_admin_ops ON public.servicios_custodia
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user_secure() OR 
    user_has_role_direct('owner') OR 
    user_has_role_direct('manager') OR 
    user_has_role_direct('supply_admin') OR 
    user_has_role_direct('supply_lead') OR 
    user_has_role_direct('coordinador_operaciones') OR 
    user_has_role_direct('jefe_seguridad') OR 
    user_has_role_direct('analista_seguridad') OR 
    user_has_role_direct('monitoring_supervisor') OR 
    user_has_role_direct('monitoring') OR 
    user_has_role_direct('bi') OR 
    user_has_role_direct('planificador')
  );