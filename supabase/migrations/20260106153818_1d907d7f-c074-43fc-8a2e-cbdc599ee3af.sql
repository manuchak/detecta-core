
-- ============================================================
-- FIX: supply_lead y ejecutivo_ventas solo deben ver SUS leads asignados
-- admin/owner/supply_admin pueden ver TODOS
-- ============================================================

-- Eliminar la política actual demasiado permisiva
DROP POLICY IF EXISTS "leads_select_authorized" ON public.leads;

-- Crear nueva política con filtro por asignación para roles no-admin
CREATE POLICY "leads_select_by_role_and_assignment"
ON public.leads
FOR SELECT
USING (
  -- Admins ven todo
  is_admin_user_secure()
  OR user_has_role_direct('supply_admin'::text)
  -- supply_lead y ejecutivo_ventas SOLO ven sus leads asignados
  OR (
    (user_has_role_direct('supply_lead'::text) OR user_has_role_direct('ejecutivo_ventas'::text))
    AND asignado_a = auth.uid()
  )
  -- supply sin asignación específica - por ahora mantener acceso de lectura general
  -- (si quieres restringirlo también, descomentar la línea siguiente)
  -- OR (user_has_role_direct('supply'::text) AND asignado_a = auth.uid())
  OR user_has_role_direct('supply'::text)
  -- Otros roles operativos mantienen acceso de solo lectura
  OR user_has_role_direct('planificador'::text)
  OR user_has_role_direct('coordinador_operaciones'::text)
  OR user_has_role_direct('jefe_seguridad'::text)
  OR user_has_role_direct('analista_seguridad'::text)
);

-- Añadir comentario para documentar la política
COMMENT ON POLICY "leads_select_by_role_and_assignment" ON public.leads IS 
'supply_lead y ejecutivo_ventas solo ven leads donde asignado_a = su user id. Admins/supply_admin ven todos.';
