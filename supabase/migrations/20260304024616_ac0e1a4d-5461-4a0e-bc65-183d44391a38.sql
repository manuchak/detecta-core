-- =====================================================
-- Clean up legacy policies with direct subqueries
-- that coexist with new SECURITY DEFINER policies
-- =====================================================

-- armado_invitations: drop 3 old policies
DROP POLICY IF EXISTS "Admin, supply and ops can create armado invitations" ON public.armado_invitations;
DROP POLICY IF EXISTS "Admin, supply and ops can view armado invitations" ON public.armado_invitations;
DROP POLICY IF EXISTS "Admin, supply and ops can update armado invitations" ON public.armado_invitations;

-- candidato_risk_checklist: drop 3 old policies
DROP POLICY IF EXISTS "risk_checklist_insert_supply" ON public.candidato_risk_checklist;
DROP POLICY IF EXISTS "risk_checklist_select_supply" ON public.candidato_risk_checklist;
DROP POLICY IF EXISTS "risk_checklist_update_supply" ON public.candidato_risk_checklist;

-- candidatos_custodios: drop 4 old policies
DROP POLICY IF EXISTS "candidatos_custodios_delete_admin_only" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_custodios_insert_recruitment" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_custodios_recruitment_access" ON public.candidatos_custodios;
DROP POLICY IF EXISTS "candidatos_custodios_update_authorized" ON public.candidatos_custodios;

-- contactos_empresa: drop 2 old policies (one had obsolete roles)
DROP POLICY IF EXISTS "Admins pueden gestionar contactos de empresa" ON public.contactos_empresa;
DROP POLICY IF EXISTS "Contactos de empresa para roles autorizados" ON public.contactos_empresa;

-- custodian_invitations: drop 3 old policies
DROP POLICY IF EXISTS "Admin, supply and ops can create invitations" ON public.custodian_invitations;
DROP POLICY IF EXISTS "Admin, supply and ops can view invitations" ON public.custodian_invitations;
DROP POLICY IF EXISTS "Admin, supply and ops can update invitations" ON public.custodian_invitations;

-- custodio_liberacion: drop old policy
DROP POLICY IF EXISTS "Supply puede gestionar liberaciones" ON public.custodio_liberacion;

-- custodio_state_transitions: drop 2 old policies
DROP POLICY IF EXISTS "state_transitions_insert_supply" ON public.custodio_state_transitions;
DROP POLICY IF EXISTS "state_transitions_select_supply" ON public.custodio_state_transitions;

-- custodios_operativos: drop old policy
DROP POLICY IF EXISTS "custodios_operativos_admin_manage" ON public.custodios_operativos;

-- documentos_candidato: drop 4 old policies
DROP POLICY IF EXISTS "documentos_candidato_delete_admin" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_insert_hr_admin" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_select_hr_admin" ON public.documentos_candidato;
DROP POLICY IF EXISTS "documentos_candidato_update_hr_admin" ON public.documentos_candidato;

-- entrevistas_estructuradas: drop 3 old policies
DROP POLICY IF EXISTS "entrevistas_insert_supply" ON public.entrevistas_estructuradas;
DROP POLICY IF EXISTS "entrevistas_select_supply" ON public.entrevistas_estructuradas;
DROP POLICY IF EXISTS "entrevistas_update_supply" ON public.entrevistas_estructuradas;

-- evaluaciones_normas: drop old policy (keep instaladores self-view)
DROP POLICY IF EXISTS "Admins y evaluadores pueden gestionar evaluaciones" ON public.evaluaciones_normas;

-- evaluaciones_psicometricas: drop 4 old policies (keep anon SIERCP insert)
DROP POLICY IF EXISTS "insert_psicometricos" ON public.evaluaciones_psicometricas;
DROP POLICY IF EXISTS "select_psicometricos" ON public.evaluaciones_psicometricas;
DROP POLICY IF EXISTS "update_psicometricos" ON public.evaluaciones_psicometricas;
DROP POLICY IF EXISTS "Evaluaciones psicometricas solo para supply admin" ON public.evaluaciones_psicometricas;

-- evaluaciones_toxicologicas: drop 4 old policies
DROP POLICY IF EXISTS "insert_toxicologicos" ON public.evaluaciones_toxicologicas;
DROP POLICY IF EXISTS "select_toxicologicos" ON public.evaluaciones_toxicologicas;
DROP POLICY IF EXISTS "update_toxicologicos" ON public.evaluaciones_toxicologicas;
DROP POLICY IF EXISTS "Evaluaciones toxicologicas solo para supply admin" ON public.evaluaciones_toxicologicas;

-- inventario_gps: keep "Admin can manage inventario_gps" (uses check_admin_secure-like pattern)
-- Only the new "Inventario GPS para roles de supply chain" replaces the old SELECT one

-- lead_approval_process: drop old policy
DROP POLICY IF EXISTS "Allow authorized users to update lead approval process" ON public.lead_approval_process;

-- personal_proveedor_armados: drop 3 old policies with direct subqueries
DROP POLICY IF EXISTS "personal_proveedor_insert_authorized" ON public.personal_proveedor_armados;
DROP POLICY IF EXISTS "Personal armados visible para roles autorizados" ON public.personal_proveedor_armados;
DROP POLICY IF EXISTS "personal_proveedor_select_authorized" ON public.personal_proveedor_armados;
DROP POLICY IF EXISTS "personal_proveedor_update_authorized" ON public.personal_proveedor_armados;

-- referencias_candidato: drop 4 old policies
DROP POLICY IF EXISTS "delete_referencias" ON public.referencias_candidato;
DROP POLICY IF EXISTS "insert_referencias" ON public.referencias_candidato;
DROP POLICY IF EXISTS "select_referencias" ON public.referencias_candidato;
DROP POLICY IF EXISTS "update_referencias" ON public.referencias_candidato;

-- siercp_invitations: drop old policy (keep anon policies)
DROP POLICY IF EXISTS "Supply roles can manage siercp invitations" ON public.siercp_invitations;

-- siercp_results: drop 3 old policies (keep user self-view/insert)
DROP POLICY IF EXISTS "Admins can delete SIERCP results" ON public.siercp_results;
DROP POLICY IF EXISTS "Admins can view all SIERCP results" ON public.siercp_results;
DROP POLICY IF EXISTS "Admins can update SIERCP results" ON public.siercp_results;

-- workflow_validation_config: drop old policy
DROP POLICY IF EXISTS "workflow_validation_config_select" ON public.workflow_validation_config;
DROP POLICY IF EXISTS "workflow_validation_config_update" ON public.workflow_validation_config;