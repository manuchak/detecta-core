
-- =============================================
-- Fase 1: Create SECURITY DEFINER helper functions
-- =============================================

-- Generic planning role check (admin, owner, coord, planificador, supply_admin)
CREATE OR REPLACE FUNCTION public.has_planning_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','coordinador_operaciones','planificador','supply_admin'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- Extended planning role (includes monitoring/c4/supply_lead/jefe_seguridad for broader read access)
CREATE OR REPLACE FUNCTION public.has_planning_read_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','coordinador_operaciones','planificador','supply_admin',
                         'supply_lead','jefe_seguridad','c4','monitoreo','monitoring_supervisor'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- Admin-only management role for planning
CREATE OR REPLACE FUNCTION public.has_planning_admin_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','coordinador_operaciones','supply_admin'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- Staff role for checklist visibility
CREATE OR REPLACE FUNCTION public.has_staff_checklist_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','monitoring','planificador','coordinador_operaciones','ejecutivo_ventas'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- =============================================
-- Fase 2: Recreate policies using SECURITY DEFINER functions
-- =============================================

-- === armados ===
DROP POLICY IF EXISTS "Authorized users can view armados" ON public.armados;
CREATE POLICY "Authorized users can view armados" ON public.armados
  FOR SELECT TO authenticated USING (has_planning_role());

DROP POLICY IF EXISTS "Authorized users can manage armados" ON public.armados;
CREATE POLICY "Authorized users can manage armados" ON public.armados
  FOR ALL TO authenticated USING (has_planning_admin_role()) WITH CHECK (has_planning_admin_role());

-- === armados_operativos ===
DROP POLICY IF EXISTS "armados_operativos_select_authorized" ON public.armados_operativos;
CREATE POLICY "armados_operativos_select_authorized" ON public.armados_operativos
  FOR SELECT TO authenticated USING (has_planning_read_role());

DROP POLICY IF EXISTS "armados_operativos_insert_authorized" ON public.armados_operativos;
CREATE POLICY "armados_operativos_insert_authorized" ON public.armados_operativos
  FOR INSERT TO authenticated WITH CHECK (has_planning_admin_role());

DROP POLICY IF EXISTS "planificadores_can_insert_armados" ON public.armados_operativos;
CREATE POLICY "planificadores_can_insert_armados" ON public.armados_operativos
  FOR INSERT TO authenticated WITH CHECK (has_planning_role());

DROP POLICY IF EXISTS "armados_operativos_update_authorized" ON public.armados_operativos;
CREATE POLICY "armados_operativos_update_authorized" ON public.armados_operativos
  FOR UPDATE TO authenticated USING (has_planning_admin_role());

-- === armados_indisponibilidades ===
DROP POLICY IF EXISTS "armados_indisponibilidades_select_authorized" ON public.armados_indisponibilidades;
CREATE POLICY "armados_indisponibilidades_select_authorized" ON public.armados_indisponibilidades
  FOR SELECT TO authenticated USING (has_planning_role());

DROP POLICY IF EXISTS "armados_indisponibilidades_modify_authorized" ON public.armados_indisponibilidades;
CREATE POLICY "armados_indisponibilidades_modify_authorized" ON public.armados_indisponibilidades
  FOR ALL TO authenticated USING (has_planning_admin_role()) WITH CHECK (has_planning_admin_role());

-- === armados_performance_metrics ===
DROP POLICY IF EXISTS "armados_performance_select_authorized" ON public.armados_performance_metrics;
CREATE POLICY "armados_performance_select_authorized" ON public.armados_performance_metrics
  FOR SELECT TO authenticated USING (has_planning_role());

DROP POLICY IF EXISTS "armados_performance_modify_admin" ON public.armados_performance_metrics;
CREATE POLICY "armados_performance_modify_admin" ON public.armados_performance_metrics
  FOR ALL TO authenticated USING (has_planning_admin_role()) WITH CHECK (has_planning_admin_role());

-- === asignacion_armados ===
DROP POLICY IF EXISTS "Authorized users can view assignments" ON public.asignacion_armados;
CREATE POLICY "Authorized users can view assignments" ON public.asignacion_armados
  FOR SELECT TO authenticated USING (has_planning_role());

DROP POLICY IF EXISTS "Authorized users can manage assignments" ON public.asignacion_armados;
CREATE POLICY "Authorized users can manage assignments" ON public.asignacion_armados
  FOR ALL TO authenticated USING (has_planning_role()) WITH CHECK (has_planning_role());

-- === checklist_servicio (staff read) ===
DROP POLICY IF EXISTS "Staff ve todos los checklists" ON public.checklist_servicio;
CREATE POLICY "Staff ve todos los checklists" ON public.checklist_servicio
  FOR SELECT TO authenticated USING (has_staff_checklist_role());

-- === matriz_precios_rutas (replace subquery policies) ===
DROP POLICY IF EXISTS "matriz_precios_select_authorized" ON public.matriz_precios_rutas;
CREATE POLICY "matriz_precios_select_authorized" ON public.matriz_precios_rutas
  FOR SELECT TO authenticated USING (has_planning_role());

DROP POLICY IF EXISTS "matriz_precios_insert_authorized" ON public.matriz_precios_rutas;
CREATE POLICY "matriz_precios_insert_authorized" ON public.matriz_precios_rutas
  FOR INSERT TO authenticated WITH CHECK (has_planning_role());

DROP POLICY IF EXISTS "matriz_precios_update_authorized" ON public.matriz_precios_rutas;
CREATE POLICY "matriz_precios_update_authorized" ON public.matriz_precios_rutas
  FOR UPDATE TO authenticated USING (has_planning_role()) WITH CHECK (has_planning_role());

DROP POLICY IF EXISTS "matriz_precios_rutas_delete_admin" ON public.matriz_precios_rutas;
CREATE POLICY "matriz_precios_rutas_delete_admin" ON public.matriz_precios_rutas
  FOR DELETE TO authenticated USING (has_planning_admin_role());
