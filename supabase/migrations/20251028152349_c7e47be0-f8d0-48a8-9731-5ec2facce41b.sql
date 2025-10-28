-- Tighten policies by scoping them to authenticated role (no behavior change for logged-in users)
-- Do NOT change USING/WITH CHECK expressions to avoid breaking existing logic

-- armados_operativos
ALTER POLICY "armados_operativos_insert_authorized" ON public.armados_operativos TO authenticated;
ALTER POLICY "armados_operativos_select_authorized" ON public.armados_operativos TO authenticated;
ALTER POLICY "armados_operativos_update_authorized" ON public.armados_operativos TO authenticated;

-- custodios_operativos
ALTER POLICY "custodios_operativos_admin_manage" ON public.custodios_operativos TO authenticated;
ALTER POLICY "custodios_operativos_read" ON public.custodios_operativos TO authenticated;

-- gastos_externos
ALTER POLICY "gastos_externos_delete_admin" ON public.gastos_externos TO authenticated;
ALTER POLICY "gastos_externos_insert_admin" ON public.gastos_externos TO authenticated;
ALTER POLICY "gastos_externos_select_finance" ON public.gastos_externos TO authenticated;
ALTER POLICY "gastos_externos_update_admin" ON public.gastos_externos TO authenticated;

-- instaladores
ALTER POLICY "Admins pueden gestionar todos los instaladores" ON public.instaladores TO authenticated;
ALTER POLICY "Coordinadores crean instaladores" ON public.instaladores TO authenticated;
ALTER POLICY "Cualquier usuario autenticado puede crear instaladores" ON public.instaladores TO authenticated;
ALTER POLICY "Instaladores actualizan sus datos" ON public.instaladores TO authenticated;
ALTER POLICY "Instaladores pueden actualizar sus propios datos" ON public.instaladores TO authenticated;
ALTER POLICY "Instaladores pueden ver sus propios datos" ON public.instaladores TO authenticated;
ALTER POLICY "Instaladores ven sus datos propios" ON public.instaladores TO authenticated;
ALTER POLICY "Usuarios autenticados pueden ver instaladores activos" ON public.instaladores TO authenticated;

-- matriz_precios_rutas
ALTER POLICY "Solo admins pueden eliminar matriz de precios" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_insert_authorized_secure" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_rutas_delete_admin" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_rutas_insert_authorized" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_rutas_update_admin" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_select_role_based" ON public.matriz_precios_rutas TO authenticated;
ALTER POLICY "matriz_precios_update_restricted_secure" ON public.matriz_precios_rutas TO authenticated;

-- pc_clientes
ALTER POLICY "pc_clientes_delete" ON public.pc_clientes TO authenticated;
ALTER POLICY "pc_clientes_insert" ON public.pc_clientes TO authenticated;
ALTER POLICY "pc_clientes_select" ON public.pc_clientes TO authenticated;
ALTER POLICY "pc_clientes_update" ON public.pc_clientes TO authenticated;

-- proveedores_armados
ALTER POLICY "proveedores_armados_insert_authorized" ON public.proveedores_armados TO authenticated;
ALTER POLICY "proveedores_armados_select_authorized" ON public.proveedores_armados TO authenticated;
ALTER POLICY "proveedores_armados_update_authorized" ON public.proveedores_armados TO authenticated;

-- servicios_custodia
ALTER POLICY "Servicios custodia acceso controlado" ON public.servicios_custodia TO authenticated;
ALTER POLICY "Servicios custodia borrado restringido" ON public.servicios_custodia TO authenticated;
ALTER POLICY "Servicios custodia insercion restringida" ON public.servicios_custodia TO authenticated;
ALTER POLICY "Servicios custodia modificacion restringida" ON public.servicios_custodia TO authenticated;

-- Ensure anon has no direct privileges (RLS still applies). These are idempotent in effect.
REVOKE ALL ON public.armados_operativos FROM anon;
REVOKE ALL ON public.custodios_operativos FROM anon;
REVOKE ALL ON public.gastos_externos FROM anon;
REVOKE ALL ON public.instaladores FROM anon;
REVOKE ALL ON public.matriz_precios_rutas FROM anon;
REVOKE ALL ON public.pc_clientes FROM anon;
REVOKE ALL ON public.proveedores_armados FROM anon;
REVOKE ALL ON public.servicios_custodia FROM anon;