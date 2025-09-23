-- Eliminar las políticas RLS conflictivas que están bloqueando a supply_lead
-- Estas políticas antiguas no incluyen el rol supply_lead y están causando conflictos

-- Eliminar la política antigua que bloquea las modificaciones de supply_lead
DROP POLICY IF EXISTS "Equipo ventas modifica leads" ON public.leads;

-- Eliminar la política de SELECT que puede estar causando confusión
DROP POLICY IF EXISTS "Leads para equipo autorizado" ON public.leads;

-- Las políticas nuevas que quedan son las correctas:
-- leads_select_sales_only, leads_insert_sales_only, leads_update_sales_only, leads_delete_sales_only
-- Todas estas incluyen correctamente el rol 'supply_lead'

-- Verificar que las funciones de seguridad incluyen supply_lead (ya están correctas)
-- Las funciones como update_approval_process(), save_interview_session(), etc. 
-- ya incluyen user_has_role_direct('supply_lead') en sus verificaciones