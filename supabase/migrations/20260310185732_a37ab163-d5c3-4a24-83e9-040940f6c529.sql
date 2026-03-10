
-- 1. servicios_custodia: add finanzas_admin and facturacion_admin to SELECT
DROP POLICY IF EXISTS "servicios_custodia_select_admin_ops" ON public.servicios_custodia;
CREATE POLICY "servicios_custodia_select_admin_ops"
  ON public.servicios_custodia FOR SELECT TO authenticated
  USING (
    is_admin_user_secure()
    OR user_has_role_direct('owner')
    OR user_has_role_direct('manager')
    OR user_has_role_direct('supply_admin')
    OR user_has_role_direct('supply_lead')
    OR user_has_role_direct('coordinador_operaciones')
    OR user_has_role_direct('jefe_seguridad')
    OR user_has_role_direct('analista_seguridad')
    OR user_has_role_direct('monitoring_supervisor')
    OR user_has_role_direct('monitoring')
    OR user_has_role_direct('bi')
    OR user_has_role_direct('planificador')
    OR user_has_role_direct('finanzas_admin')
    OR user_has_role_direct('facturacion_admin')
  );

-- 2. proveedores_armados: add finanzas_admin and facturacion_admin to SELECT
DROP POLICY IF EXISTS "proveedores_armados_select_authorized" ON public.proveedores_armados;
CREATE POLICY "proveedores_armados_select_authorized"
  ON public.proveedores_armados FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = ANY(ARRAY[
          'admin','owner','coordinador_operaciones','planificador',
          'supply_admin','supply_lead','jefe_seguridad','c4',
          'monitoreo','monitoring_supervisor',
          'finanzas_admin','facturacion_admin'
        ])
    )
  );
