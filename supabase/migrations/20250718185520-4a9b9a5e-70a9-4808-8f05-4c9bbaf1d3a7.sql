-- LIMPIEZA COMPLETA DE POLÍTICAS RLS PARA ESTRATEGIA NACIONAL DE RECLUTAMIENTO

-- 1. ELIMINAR TODAS LAS POLÍTICAS CONFLICTIVAS
DROP POLICY IF EXISTS "Admins pueden gestionar alertas" ON public.alertas_sistema_nacional;
DROP POLICY IF EXISTS "Admins pueden gestionar métricas demanda" ON public.metricas_demanda_zona;
DROP POLICY IF EXISTS "Admins pueden gestionar métricas de demanda" ON public.metricas_demanda_zona;
DROP POLICY IF EXISTS "Admins pueden gestionar métricas reclutamiento" ON public.metricas_reclutamiento;
DROP POLICY IF EXISTS "Admins pueden gestionar métricas de reclutamiento" ON public.metricas_reclutamiento;
DROP POLICY IF EXISTS "Admins pueden gestionar zonas" ON public.zonas_operacion_nacional;

-- 2. CREAR POLÍTICAS ESTANDARIZADAS USANDO FUNCIONES QUE FUNCIONAN

-- 2.1 ZONAS OPERACION NACIONAL
CREATE POLICY "zonas_admin_manage"
ON public.zonas_operacion_nacional
FOR ALL
TO authenticated
USING (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text))
WITH CHECK (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text));

CREATE POLICY "zonas_all_read"
ON public.zonas_operacion_nacional
FOR SELECT
TO authenticated
USING (true);

-- 2.2 ALERTAS SISTEMA NACIONAL
CREATE POLICY "alertas_admin_manage"
ON public.alertas_sistema_nacional
FOR ALL
TO authenticated
USING (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text))
WITH CHECK (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text));

CREATE POLICY "alertas_all_read"
ON public.alertas_sistema_nacional
FOR SELECT
TO authenticated
USING (true);

-- 2.3 METRICAS DEMANDA ZONA
CREATE POLICY "metricas_demanda_admin_manage"
ON public.metricas_demanda_zona
FOR ALL
TO authenticated
USING (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text))
WITH CHECK (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text));

CREATE POLICY "metricas_demanda_all_read"
ON public.metricas_demanda_zona
FOR SELECT
TO authenticated
USING (true);

-- 2.4 METRICAS RECLUTAMIENTO
CREATE POLICY "metricas_reclutamiento_admin_manage"
ON public.metricas_reclutamiento
FOR ALL
TO authenticated
USING (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text))
WITH CHECK (check_admin_secure() OR user_has_role_direct('supply_admin'::text) OR user_has_role_direct('coordinador_operaciones'::text));

CREATE POLICY "metricas_reclutamiento_all_read"
ON public.metricas_reclutamiento
FOR SELECT
TO authenticated
USING (true);