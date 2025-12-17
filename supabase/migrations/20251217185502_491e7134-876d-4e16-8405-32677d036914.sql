-- Permitir que planificadores vean leads para asignación de armados virtuales
-- Esto resuelve el problema de Daniela que no puede ver armados liberados por Supply

-- Eliminar política existente
DROP POLICY IF EXISTS "leads_select_sales_only" ON leads;
DROP POLICY IF EXISTS "leads_select_authorized" ON leads;

-- Crear nueva política que incluye planificador
CREATE POLICY "leads_select_authorized" ON leads
FOR SELECT TO authenticated
USING (
  is_admin_user_secure() 
  OR user_has_role_direct('supply_admin')
  OR user_has_role_direct('supply_lead')
  OR user_has_role_direct('supply')
  OR user_has_role_direct('ejecutivo_ventas')
  OR user_has_role_direct('planificador')
  OR user_has_role_direct('coordinador_operaciones')
  OR user_has_role_direct('jefe_seguridad')
  OR user_has_role_direct('analista_seguridad')
);