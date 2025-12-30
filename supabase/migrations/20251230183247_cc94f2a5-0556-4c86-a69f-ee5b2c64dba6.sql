
-- Fix knowledge_base tables security: restrict to authenticated users only

-- 1. Revoke anon access from all knowledge_base tables
REVOKE ALL ON public.knowledge_base_categories FROM anon;
REVOKE ALL ON public.knowledge_base_intents FROM anon;
REVOKE ALL ON public.knowledge_base_playbooks FROM anon;
REVOKE ALL ON public.knowledge_base_templates FROM anon;
REVOKE ALL ON public.knowledge_base_guardrails FROM anon;
REVOKE ALL ON public.knowledge_base_glossary FROM anon;
REVOKE ALL ON public.knowledge_base_escalation_matrix FROM anon;

-- 2. Enable FORCE ROW LEVEL SECURITY on all tables
ALTER TABLE public.knowledge_base_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_intents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_playbooks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_guardrails FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_glossary FORCE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_escalation_matrix FORCE ROW LEVEL SECURITY;

-- 3. Drop overly permissive policies
DROP POLICY IF EXISTS "KB categories readable by all" ON public.knowledge_base_categories;
DROP POLICY IF EXISTS "KB intents readable by all" ON public.knowledge_base_intents;
DROP POLICY IF EXISTS "KB playbooks readable by all" ON public.knowledge_base_playbooks;
DROP POLICY IF EXISTS "KB templates readable by all" ON public.knowledge_base_templates;
DROP POLICY IF EXISTS "KB guardrails readable by all" ON public.knowledge_base_guardrails;
DROP POLICY IF EXISTS "KB glossary readable by all" ON public.knowledge_base_glossary;
DROP POLICY IF EXISTS "KB escalation readable by all" ON public.knowledge_base_escalation_matrix;

-- 4. Create proper RLS policies for authenticated users
-- Categories - all authenticated users can read
CREATE POLICY "kb_categories_select_authenticated" ON public.knowledge_base_categories
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Intents - all authenticated users can read
CREATE POLICY "kb_intents_select_authenticated" ON public.knowledge_base_intents
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Playbooks - all authenticated users can read
CREATE POLICY "kb_playbooks_select_authenticated" ON public.knowledge_base_playbooks
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Templates - all authenticated users can read
CREATE POLICY "kb_templates_select_authenticated" ON public.knowledge_base_templates
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Guardrails - all authenticated users can read
CREATE POLICY "kb_guardrails_select_authenticated" ON public.knowledge_base_guardrails
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Glossary - all authenticated users can read
CREATE POLICY "kb_glossary_select_authenticated" ON public.knowledge_base_glossary
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Escalation Matrix - all authenticated users can read
CREATE POLICY "kb_escalation_select_authenticated" ON public.knowledge_base_escalation_matrix
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- 5. Add admin write policies for management
CREATE POLICY "kb_categories_admin_all" ON public.knowledge_base_categories
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_intents_admin_all" ON public.knowledge_base_intents
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_playbooks_admin_all" ON public.knowledge_base_playbooks
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_templates_admin_all" ON public.knowledge_base_templates
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_guardrails_admin_all" ON public.knowledge_base_guardrails
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_glossary_admin_all" ON public.knowledge_base_glossary
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));

CREATE POLICY "kb_escalation_admin_all" ON public.knowledge_base_escalation_matrix
  FOR ALL TO authenticated 
  USING (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'))
  WITH CHECK (is_admin_user_secure() OR user_has_role_direct('owner') OR user_has_role_direct('monitoring_supervisor'));
