
-- =============================================
-- FASE 1: Crear/actualizar funciones SECURITY DEFINER
-- =============================================

-- 1. Actualizar is_admin_bypass_rls() — eliminar rol obsoleto 'manager'
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
  );
END;
$$;

-- 2. has_monitoring_role()
CREATE OR REPLACE FUNCTION public.has_monitoring_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'monitoring', 'monitoring_supervisor', 'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad', 'planificador')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 3. has_monitoring_write_role()
CREATE OR REPLACE FUNCTION public.has_monitoring_write_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 4. Actualizar user_has_wms_access() — agregar supply_lead
CREATE OR REPLACE FUNCTION public.user_has_wms_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'supply_admin', 'supply_lead', 'monitoring_supervisor', 'coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 5. can_manage_wms() ya tiene los roles correctos, solo agregar is_active check
CREATE OR REPLACE FUNCTION public.can_manage_wms()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 6. has_ticket_role()
CREATE OR REPLACE FUNCTION public.has_ticket_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'soporte', 'coordinador_operaciones', 'planificador', 'monitoring', 'monitoring_supervisor')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 7. has_ticket_admin_role()
CREATE OR REPLACE FUNCTION public.has_ticket_admin_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'soporte', 'coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 8. has_crm_role()
CREATE OR REPLACE FUNCTION public.has_crm_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones', 'supply_admin', 'bi', 'customer_success')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 9. has_facturacion_role()
CREATE OR REPLACE FUNCTION public.has_facturacion_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'facturacion_admin', 'finanzas_admin', 'bi', 'coordinador_operaciones')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 10. has_facturacion_write_role()
CREATE OR REPLACE FUNCTION public.has_facturacion_write_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'facturacion_admin', 'finanzas_admin')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- 11. Actualizar es_staff_incidentes() — eliminar 'gerente_operaciones' obsoleto
CREATE OR REPLACE FUNCTION public.es_staff_incidentes()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'planificador', 'monitoring', 'coordinador_operaciones', 'monitoring_supervisor')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$;

-- =============================================
-- FASE 2A: MONITOREO — servicios_monitoreo
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Usuarios autenticados pueden acceder a servicios_monitoreo" ON servicios_monitoreo;
DROP POLICY IF EXISTS "Coordinadores pueden actualizar estado de servicios" ON servicios_monitoreo;

-- New policies using DEFINER functions
CREATE POLICY "monitoring_select" ON servicios_monitoreo
  FOR SELECT TO authenticated
  USING (has_monitoring_role());

CREATE POLICY "monitoring_insert" ON servicios_monitoreo
  FOR INSERT TO authenticated
  WITH CHECK (has_monitoring_write_role());

CREATE POLICY "monitoring_update" ON servicios_monitoreo
  FOR UPDATE TO authenticated
  USING (has_monitoring_write_role())
  WITH CHECK (has_monitoring_write_role());

CREATE POLICY "monitoring_delete" ON servicios_monitoreo
  FOR DELETE TO authenticated
  USING (has_monitoring_write_role());

-- =============================================
-- FASE 2A: MONITOREO — zonas_operacion_nacional (15 policies → 2)
-- =============================================

DROP POLICY IF EXISTS "BI data restricted access - zonas_operacion" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "National operation zones access restricted" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "Only authorized roles can modify operation zones" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_admin_manage" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_admin_manage" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_manage_coordinators" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_nacional_admin_manage" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_nacional_operational_access" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_operational_access" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_read_operational" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_read_restricted" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_restricted" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_restricted_access" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_secure_access" ON zonas_operacion_nacional;
DROP POLICY IF EXISTS "zonas_operacion_secure_write" ON zonas_operacion_nacional;

-- Only 2 clean policies
CREATE POLICY "zonas_select" ON zonas_operacion_nacional
  FOR SELECT TO authenticated
  USING (has_monitoring_role());

CREATE POLICY "zonas_write" ON zonas_operacion_nacional
  FOR ALL TO authenticated
  USING (has_monitoring_write_role())
  WITH CHECK (has_monitoring_write_role());

-- =============================================
-- FASE 2B: WMS — Drop legacy ALL-open + subquery duplicates
-- =============================================

-- ordenes_compra
DROP POLICY IF EXISTS "Allow all authenticated users ordenes_compra" ON ordenes_compra;
DROP POLICY IF EXISTS "wms_admins_gestionan_ordenes" ON ordenes_compra;

CREATE POLICY "wms_ordenes_write" ON ordenes_compra
  FOR ALL TO authenticated
  USING (can_manage_wms())
  WITH CHECK (can_manage_wms());

-- recepciones_mercancia
DROP POLICY IF EXISTS "Allow all authenticated users recepciones_mercancia" ON recepciones_mercancia;
DROP POLICY IF EXISTS "wms_admins_gestionan_recepciones" ON recepciones_mercancia;

CREATE POLICY "wms_recepciones_write" ON recepciones_mercancia
  FOR ALL TO authenticated
  USING (can_manage_wms())
  WITH CHECK (can_manage_wms());

-- proveedores
DROP POLICY IF EXISTS "Allow all authenticated users proveedores" ON proveedores;
DROP POLICY IF EXISTS "wms_admins_gestionan_proveedores" ON proveedores;

CREATE POLICY "wms_proveedores_write" ON proveedores
  FOR ALL TO authenticated
  USING (can_manage_wms())
  WITH CHECK (can_manage_wms());

-- stock_productos
DROP POLICY IF EXISTS "Allow all authenticated users stock_productos" ON stock_productos;
DROP POLICY IF EXISTS "wms_admins_gestionan_stock" ON stock_productos;

-- categorias_productos
DROP POLICY IF EXISTS "wms_admins_gestionan_categorias" ON categorias_productos;
DROP POLICY IF EXISTS "categorias_productos_authenticated_read" ON categorias_productos;
-- Keep: wms_roles_ven_categorias (SELECT via user_has_wms_access)
-- Keep: categorias_productos_restricted_insert/update/delete (use DEFINER functions)

-- movimientos_inventario
DROP POLICY IF EXISTS "wms_admins_gestionan_movimientos" ON movimientos_inventario;
DROP POLICY IF EXISTS "admin_only_movimientos_delete" ON movimientos_inventario;
-- Keep: wms_access_movimientos_read/insert/update (use can_manage_wms DEFINER)
-- Keep: wms_roles_ven_movimientos (SELECT via user_has_wms_access)

-- productos_inventario
DROP POLICY IF EXISTS "wms_admins_gestionan_productos" ON productos_inventario;
-- Keep: wms_access_productos_inventario (ALL via can_manage_wms DEFINER)
-- Keep: wms_roles_ven_productos (SELECT via user_has_wms_access)

-- =============================================
-- FASE 2C: FACTURACIÓN — facturas (quitar true)
-- =============================================

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver facturas" ON facturas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear facturas" ON facturas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar facturas" ON facturas;

CREATE POLICY "facturas_select" ON facturas
  FOR SELECT TO authenticated
  USING (has_facturacion_role());

CREATE POLICY "facturas_insert" ON facturas
  FOR INSERT TO authenticated
  WITH CHECK (has_facturacion_write_role());

CREATE POLICY "facturas_update" ON facturas
  FOR UPDATE TO authenticated
  USING (has_facturacion_write_role())
  WITH CHECK (has_facturacion_write_role());

CREATE POLICY "facturas_delete" ON facturas
  FOR DELETE TO authenticated
  USING (is_admin_bypass_rls());

-- audit_facturacion_accesos — migrate subquery to DEFINER
DROP POLICY IF EXISTS "audit_facturacion_select" ON audit_facturacion_accesos;

CREATE POLICY "audit_facturacion_select_v2" ON audit_facturacion_accesos
  FOR SELECT TO authenticated
  USING (has_facturacion_role());
-- Keep: audit_facturacion_insert (auth.uid() = user_id) — correct

-- pagos_proveedores_armados — migrate all subqueries to DEFINER
DROP POLICY IF EXISTS "Pagos visibles solo para finanzas y admin" ON pagos_proveedores_armados;
DROP POLICY IF EXISTS "pagos_proveedores_select_authorized" ON pagos_proveedores_armados;
DROP POLICY IF EXISTS "pagos_proveedores_insert_authorized" ON pagos_proveedores_armados;
DROP POLICY IF EXISTS "pagos_proveedores_update_authorized" ON pagos_proveedores_armados;
DROP POLICY IF EXISTS "pagos_proveedores_delete_admin" ON pagos_proveedores_armados;

CREATE POLICY "pagos_prov_select" ON pagos_proveedores_armados
  FOR SELECT TO authenticated
  USING (has_facturacion_role());

CREATE POLICY "pagos_prov_insert" ON pagos_proveedores_armados
  FOR INSERT TO authenticated
  WITH CHECK (has_facturacion_write_role() AND registrado_por = auth.uid());

CREATE POLICY "pagos_prov_update" ON pagos_proveedores_armados
  FOR UPDATE TO authenticated
  USING (has_facturacion_write_role())
  WITH CHECK (has_facturacion_write_role());

CREATE POLICY "pagos_prov_delete" ON pagos_proveedores_armados
  FOR DELETE TO authenticated
  USING (is_admin_bypass_rls());

-- pagos_instaladores — migrate subquery
DROP POLICY IF EXISTS "Admins y supply pueden gestionar pagos" ON pagos_instaladores;
-- Keep: "Instaladores pueden ver sus pagos" — correct (own data)

CREATE POLICY "pagos_inst_manage" ON pagos_instaladores
  FOR ALL TO authenticated
  USING (has_facturacion_write_role() OR is_admin_bypass_rls() OR can_manage_wms())
  WITH CHECK (has_facturacion_write_role() OR is_admin_bypass_rls() OR can_manage_wms());

-- =============================================
-- FASE 2D: CRM — migrate subqueries to has_crm_role()
-- =============================================

DROP POLICY IF EXISTS "Activities visible to authorized roles" ON crm_activities;
DROP POLICY IF EXISTS "CRM deals visible to authorized roles" ON crm_deals;
DROP POLICY IF EXISTS "Stage history visible to authorized roles" ON crm_deal_stage_history;
DROP POLICY IF EXISTS "Webhook logs visible to admins" ON crm_webhook_logs;
-- Keep INSERT/UPDATE with true (service role context)

CREATE POLICY "crm_activities_select" ON crm_activities
  FOR SELECT TO authenticated
  USING (has_crm_role());

CREATE POLICY "crm_deals_select" ON crm_deals
  FOR SELECT TO authenticated
  USING (has_crm_role());

CREATE POLICY "crm_stage_history_select" ON crm_deal_stage_history
  FOR SELECT TO authenticated
  USING (has_crm_role());

CREATE POLICY "crm_webhook_logs_select" ON crm_webhook_logs
  FOR SELECT TO authenticated
  USING (check_admin_secure());

-- =============================================
-- FASE 2E: TICKETS — migrate subqueries, replace 'manager'
-- =============================================

-- tickets table
DROP POLICY IF EXISTS "Users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Assigned users can update tickets" ON tickets;
DROP POLICY IF EXISTS "users_view_own_tickets" ON tickets;
DROP POLICY IF EXISTS "support_update_tickets" ON tickets;

-- Consolidated SELECT: ticket role OR own tickets
CREATE POLICY "tickets_select" ON tickets
  FOR SELECT TO authenticated
  USING (
    has_ticket_role()
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR (custodio_telefono IS NOT NULL AND custodio_telefono::text = (SELECT phone FROM profiles WHERE id = auth.uid()))
  );

-- Consolidated UPDATE: ticket admin role OR assigned
CREATE POLICY "tickets_update" ON tickets
  FOR UPDATE TO authenticated
  USING (
    has_ticket_admin_role()
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    has_ticket_admin_role()
    OR assigned_to = auth.uid()
  );

-- Keep: authenticated_create_tickets (INSERT with auth.uid check) — correct
-- Keep: admins_delete_tickets (DELETE admin/owner) — correct  
-- Keep: custodians_view_own_tickets_by_phone (SELECT own) — now redundant with tickets_select but harmless
-- Keep: custodians_update_own_tickets_csat (UPDATE own CSAT) — correct

-- ticket_business_hours — migrate subquery
DROP POLICY IF EXISTS "Admins can manage business hours" ON ticket_business_hours;
-- Keep: "Authenticated users can view business hours" (SELECT true) — correct for reference data

CREATE POLICY "ticket_bh_manage" ON ticket_business_hours
  FOR ALL TO authenticated
  USING (check_admin_secure())
  WITH CHECK (check_admin_secure());

-- ticket_escalation_rules — migrate subquery
DROP POLICY IF EXISTS "Admins can manage escalation rules" ON ticket_escalation_rules;
-- Keep: "Authenticated users can view escalation rules" (SELECT true)

CREATE POLICY "ticket_esc_manage" ON ticket_escalation_rules
  FOR ALL TO authenticated
  USING (check_admin_secure())
  WITH CHECK (check_admin_secure());

-- ticket_categorias_custodio — migrate subquery
DROP POLICY IF EXISTS "Solo admins modifican categorías" ON ticket_categorias_custodio;
-- Keep: "Categorías visibles para autenticados" (SELECT auth) — correct for UI dropdowns

CREATE POLICY "ticket_cat_manage" ON ticket_categorias_custodio
  FOR ALL TO authenticated
  USING (has_ticket_admin_role())
  WITH CHECK (has_ticket_admin_role());

-- ticket_subcategorias_custodio
DROP POLICY IF EXISTS "Solo admins modifican subcategorías" ON ticket_subcategorias_custodio;
-- Keep: "Subcategorías visibles para autenticados" (SELECT auth)

CREATE POLICY "ticket_subcat_manage" ON ticket_subcategorias_custodio
  FOR ALL TO authenticated
  USING (has_ticket_admin_role())
  WITH CHECK (has_ticket_admin_role());

-- ticket_response_templates — migrate subquery
DROP POLICY IF EXISTS "Admins can manage templates" ON ticket_response_templates;
-- Keep: "Authenticated users can view templates" (SELECT true)

CREATE POLICY "ticket_templates_manage" ON ticket_response_templates
  FOR ALL TO authenticated
  USING (has_ticket_admin_role())
  WITH CHECK (has_ticket_admin_role());

-- ticket_respuestas — migrate nested subquery
DROP POLICY IF EXISTS "Usuarios ven respuestas de sus tickets" ON ticket_respuestas;
-- Keep: "Usuarios pueden crear respuestas" (INSERT auth.uid) — correct

CREATE POLICY "ticket_resp_select" ON ticket_respuestas
  FOR SELECT TO authenticated
  USING (
    has_ticket_role()
    OR EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_respuestas.ticket_id
      AND (
        t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
        OR (t.custodio_telefono IS NOT NULL AND t.custodio_telefono::text = (SELECT phone FROM profiles WHERE id = auth.uid()))
      )
    )
  );
