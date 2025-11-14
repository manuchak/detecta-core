-- SPRINT 1: Eliminar política RLS duplicada en lead_approval_process
-- Solo mantenemos la política más específica que verifica directamente en user_roles

-- Eliminar la política menos específica que usa get_current_user_role_safe()
DROP POLICY IF EXISTS "Allow authenticated users to manage lead approval process" ON lead_approval_process;

-- La política que mantenemos es:
-- "Allow authorized users to update lead approval process" 
-- USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() 
--        AND role = ANY (ARRAY['admin', 'owner', 'supply_admin', 'supply_lead', 'ejecutivo_ventas'])))
-- Esta política incluye todos los roles necesarios y verifica directamente en user_roles