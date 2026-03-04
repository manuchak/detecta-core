-- =====================================================
-- Supply Module RLS Hardening: SECURITY DEFINER helpers
-- + Migrate ~38 policies + Fix obsolete roles
-- =====================================================

-- PHASE 1: Create 3 SECURITY DEFINER helper functions

CREATE OR REPLACE FUNCTION public.has_supply_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','supply_admin','supply_lead','coordinador_operaciones'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_supply_read_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','supply_admin','supply_lead','supply','ejecutivo_ventas','coordinador_operaciones','analista_seguridad','jefe_seguridad','planificador','monitoring'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

CREATE OR REPLACE FUNCTION public.has_supply_eval_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin','owner','supply_admin','supply_lead','supply','coordinador_operaciones','analista_seguridad','jefe_seguridad'])
    AND (is_active IS NULL OR is_active = true)
  )
$$;

-- PHASE 2: Migrate policies per table

-- candidatos_custodios (4 policies)
DROP POLICY IF EXISTS "Candidatos visibles para supply y admin" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "Supply puede crear candidatos" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "Supply puede actualizar candidatos" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "Admin puede eliminar candidatos" ON public.candidatos_custodios;

CREATE POLICY "Candidatos visibles para supply y admin"
ON public.candidatos_custodios FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Supply puede crear candidatos"
ON public.candidatos_custodios FOR INSERT TO authenticated
WITH CHECK (has_supply_role());

CREATE POLICY "Supply puede actualizar candidatos"
ON public.candidatos_custodios FOR UPDATE TO authenticated
USING (has_supply_role());

CREATE POLICY "Admin puede eliminar candidatos"
ON public.candidatos_custodios FOR DELETE TO authenticated
USING (has_supply_role());

-- documentos_candidato (3 policies)
DROP POLICY IF EXISTS "Staff puede ver documentos candidato" ON public.documentos_candidato;
DROP POLICY IF EXISTS "Staff puede crear documentos candidato" ON public.documentos_candidato;
DROP POLICY IF EXISTS "Staff puede actualizar documentos candidato" ON public.documentos_candidato;

CREATE POLICY "Staff puede ver documentos candidato"
ON public.documentos_candidato FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Staff puede crear documentos candidato"
ON public.documentos_candidato FOR INSERT TO authenticated
WITH CHECK (has_supply_role());

CREATE POLICY "Staff puede actualizar documentos candidato"
ON public.documentos_candidato FOR UPDATE TO authenticated
USING (has_supply_role());

-- documentos_custodio (2 policies — fix obsolete roles)
DROP POLICY IF EXISTS "Staff ve todos los documentos" ON public.documentos_custodio;
DROP POLICY IF EXISTS "Staff actualiza documentos" ON public.documentos_custodio;

CREATE POLICY "Staff ve todos los documentos"
ON public.documentos_custodio FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Staff actualiza documentos"
ON public.documentos_custodio FOR UPDATE TO authenticated
USING (has_supply_role());

-- entrevistas_estructuradas (2 policies)
DROP POLICY IF EXISTS "Supply puede ver entrevistas" ON public.entrevistas_estructuradas;
DROP POLICY IF EXISTS "Supply puede gestionar entrevistas" ON public.entrevistas_estructuradas;

CREATE POLICY "Supply puede ver entrevistas"
ON public.entrevistas_estructuradas FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Supply puede gestionar entrevistas"
ON public.entrevistas_estructuradas FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- evaluaciones_psicometricas (3 policies)
DROP POLICY IF EXISTS "Supply puede ver evaluaciones psicometricas" ON public.evaluaciones_psicometricas;
DROP POLICY IF EXISTS "Supply puede crear evaluaciones psicometricas" ON public.evaluaciones_psicometricas;
DROP POLICY IF EXISTS "Supply puede actualizar evaluaciones psicometricas" ON public.evaluaciones_psicometricas;

CREATE POLICY "Supply puede ver evaluaciones psicometricas"
ON public.evaluaciones_psicometricas FOR SELECT TO authenticated
USING (has_supply_eval_role());

CREATE POLICY "Supply puede crear evaluaciones psicometricas"
ON public.evaluaciones_psicometricas FOR INSERT TO authenticated
WITH CHECK (has_supply_eval_role());

CREATE POLICY "Supply puede actualizar evaluaciones psicometricas"
ON public.evaluaciones_psicometricas FOR UPDATE TO authenticated
USING (has_supply_eval_role());

-- evaluaciones_toxicologicas (3 policies)
DROP POLICY IF EXISTS "Supply puede ver evaluaciones toxicologicas" ON public.evaluaciones_toxicologicas;
DROP POLICY IF EXISTS "Supply puede crear evaluaciones toxicologicas" ON public.evaluaciones_toxicologicas;
DROP POLICY IF EXISTS "Supply puede actualizar evaluaciones toxicologicas" ON public.evaluaciones_toxicologicas;

CREATE POLICY "Supply puede ver evaluaciones toxicologicas"
ON public.evaluaciones_toxicologicas FOR SELECT TO authenticated
USING (has_supply_eval_role());

CREATE POLICY "Supply puede crear evaluaciones toxicologicas"
ON public.evaluaciones_toxicologicas FOR INSERT TO authenticated
WITH CHECK (has_supply_eval_role());

CREATE POLICY "Supply puede actualizar evaluaciones toxicologicas"
ON public.evaluaciones_toxicologicas FOR UPDATE TO authenticated
USING (has_supply_eval_role());

-- evaluaciones_normas (1 policy)
DROP POLICY IF EXISTS "Supply puede ver evaluaciones normas" ON public.evaluaciones_normas;

CREATE POLICY "Supply puede ver evaluaciones normas"
ON public.evaluaciones_normas FOR SELECT TO authenticated
USING (has_supply_eval_role());

-- candidato_risk_checklist (2 policies)
DROP POLICY IF EXISTS "Supply puede ver risk checklist" ON public.candidato_risk_checklist;
DROP POLICY IF EXISTS "Supply puede gestionar risk checklist" ON public.candidato_risk_checklist;

CREATE POLICY "Supply puede ver risk checklist"
ON public.candidato_risk_checklist FOR SELECT TO authenticated
USING (has_supply_eval_role());

CREATE POLICY "Supply puede gestionar risk checklist"
ON public.candidato_risk_checklist FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- referencias_candidato (3 policies)
DROP POLICY IF EXISTS "Supply puede ver referencias" ON public.referencias_candidato;
DROP POLICY IF EXISTS "Supply puede crear referencias" ON public.referencias_candidato;
DROP POLICY IF EXISTS "Supply puede actualizar referencias" ON public.referencias_candidato;

CREATE POLICY "Supply puede ver referencias"
ON public.referencias_candidato FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Supply puede crear referencias"
ON public.referencias_candidato FOR INSERT TO authenticated
WITH CHECK (has_supply_role());

CREATE POLICY "Supply puede actualizar referencias"
ON public.referencias_candidato FOR UPDATE TO authenticated
USING (has_supply_role());

-- siercp_results (3 policies)
DROP POLICY IF EXISTS "Supply puede ver resultados SIERCP" ON public.siercp_results;
DROP POLICY IF EXISTS "Supply puede crear resultados SIERCP" ON public.siercp_results;
DROP POLICY IF EXISTS "Supply puede actualizar resultados SIERCP" ON public.siercp_results;

CREATE POLICY "Supply puede ver resultados SIERCP"
ON public.siercp_results FOR SELECT TO authenticated
USING (has_supply_eval_role());

CREATE POLICY "Supply puede crear resultados SIERCP"
ON public.siercp_results FOR INSERT TO authenticated
WITH CHECK (has_supply_eval_role());

CREATE POLICY "Supply puede actualizar resultados SIERCP"
ON public.siercp_results FOR UPDATE TO authenticated
USING (has_supply_eval_role());

-- siercp_invitations (1 policy)
DROP POLICY IF EXISTS "Supply puede gestionar invitaciones SIERCP" ON public.siercp_invitations;

CREATE POLICY "Supply puede gestionar invitaciones SIERCP"
ON public.siercp_invitations FOR ALL TO authenticated
USING (has_supply_eval_role())
WITH CHECK (has_supply_eval_role());

-- lead_approval_process (1 policy)
DROP POLICY IF EXISTS "Supply puede gestionar aprobaciones" ON public.lead_approval_process;

CREATE POLICY "Supply puede gestionar aprobaciones"
ON public.lead_approval_process FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- custodio_liberacion (1 policy)
DROP POLICY IF EXISTS "Supply puede gestionar liberacion" ON public.custodio_liberacion;

CREATE POLICY "Supply puede gestionar liberacion"
ON public.custodio_liberacion FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- custodio_state_transitions (1 policy)
DROP POLICY IF EXISTS "Supply puede ver transiciones estado" ON public.custodio_state_transitions;

CREATE POLICY "Supply puede ver transiciones estado"
ON public.custodio_state_transitions FOR SELECT TO authenticated
USING (has_supply_read_role());

-- custodian_invitations (2 policies)
DROP POLICY IF EXISTS "Supply puede ver invitaciones custodio" ON public.custodian_invitations;
DROP POLICY IF EXISTS "Supply puede gestionar invitaciones custodio" ON public.custodian_invitations;

CREATE POLICY "Supply puede ver invitaciones custodio"
ON public.custodian_invitations FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Supply puede gestionar invitaciones custodio"
ON public.custodian_invitations FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- armado_invitations (2 policies)
DROP POLICY IF EXISTS "Supply puede ver invitaciones armado" ON public.armado_invitations;
DROP POLICY IF EXISTS "Supply puede gestionar invitaciones armado" ON public.armado_invitations;

CREATE POLICY "Supply puede ver invitaciones armado"
ON public.armado_invitations FOR SELECT TO authenticated
USING (has_supply_read_role());

CREATE POLICY "Supply puede gestionar invitaciones armado"
ON public.armado_invitations FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- custodios_operativos (1 policy — admin manage)
DROP POLICY IF EXISTS "Admin manage custodios operativos" ON public.custodios_operativos;

CREATE POLICY "Admin manage custodios operativos"
ON public.custodios_operativos FOR ALL TO authenticated
USING (has_supply_role())
WITH CHECK (has_supply_role());

-- workflow_validation_config (1 policy)
DROP POLICY IF EXISTS "Supply puede ver config validacion" ON public.workflow_validation_config;

CREATE POLICY "Supply puede ver config validacion"
ON public.workflow_validation_config FOR SELECT TO authenticated
USING (has_supply_read_role());

-- contactos_empresa (fix obsolete role)
DROP POLICY IF EXISTS "Contactos visibles para roles operativos" ON public.contactos_empresa;

CREATE POLICY "Contactos visibles para roles operativos"
ON public.contactos_empresa FOR SELECT TO authenticated
USING (has_supply_read_role());

-- inventario_gps (fix obsolete roles)
DROP POLICY IF EXISTS "Inventario GPS para roles de supply chain" ON public.inventario_gps;

CREATE POLICY "Inventario GPS para roles de supply chain"
ON public.inventario_gps FOR SELECT TO authenticated
USING (has_supply_read_role());

-- personal_proveedor_armados (fix obsolete role)
DROP POLICY IF EXISTS "Personal armados visible para supply" ON public.personal_proveedor_armados;

CREATE POLICY "Personal armados visible para supply"
ON public.personal_proveedor_armados FOR SELECT TO authenticated
USING (has_supply_read_role());