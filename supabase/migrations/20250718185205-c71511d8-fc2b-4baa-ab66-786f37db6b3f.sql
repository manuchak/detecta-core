-- Eliminar la política actual que no funciona
DROP POLICY IF EXISTS "Admins pueden gestionar candidatos" ON public.candidatos_custodios;

-- Crear políticas usando las mismas funciones que funcionan en leads
CREATE POLICY "candidatos_admin_manage"
ON public.candidatos_custodios
FOR ALL
TO authenticated
USING (check_admin_secure())
WITH CHECK (check_admin_secure());

CREATE POLICY "candidatos_all_read"
ON public.candidatos_custodios
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "candidatos_supply_admin_update"
ON public.candidatos_custodios
FOR UPDATE
TO authenticated
USING (check_admin_secure() OR user_has_role_direct('supply_admin'::text))
WITH CHECK (check_admin_secure() OR user_has_role_direct('supply_admin'::text));