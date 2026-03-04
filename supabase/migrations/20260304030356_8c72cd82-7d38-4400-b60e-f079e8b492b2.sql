
-- ============================================================
-- Crear has_cs_management_role() SECURITY DEFINER
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_cs_management_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones', 'planificador', 'bi')
      AND is_active = true
  )
$$;

-- ============================================================
-- Fase 4: Migrar ~10 policies CS + endurecer NPS/CSAT
-- ============================================================

-- ----- cs_quejas -----
DROP POLICY IF EXISTS "CS staff full access quejas" ON public.cs_quejas;
DROP POLICY IF EXISTS "customer_success_select_cs_quejas" ON public.cs_quejas;
DROP POLICY IF EXISTS "BI readonly quejas" ON public.cs_quejas;

CREATE POLICY "cs_staff_all_quejas" ON public.cs_quejas
  FOR ALL TO authenticated
  USING (public.has_cs_management_role(auth.uid()))
  WITH CHECK (public.has_cs_management_role(auth.uid()));

-- ----- cs_touchpoints -----
DROP POLICY IF EXISTS "CS staff full access touchpoints" ON public.cs_touchpoints;
DROP POLICY IF EXISTS "customer_success_select_cs_touchpoints" ON public.cs_touchpoints;
DROP POLICY IF EXISTS "customer_success_insert_cs_touchpoints" ON public.cs_touchpoints;
DROP POLICY IF EXISTS "customer_success_update_cs_touchpoints" ON public.cs_touchpoints;

CREATE POLICY "cs_staff_all_touchpoints" ON public.cs_touchpoints
  FOR ALL TO authenticated
  USING (public.has_cs_management_role(auth.uid()))
  WITH CHECK (public.has_cs_management_role(auth.uid()));

-- ----- cs_capa -----
DROP POLICY IF EXISTS "CS staff full access capa" ON public.cs_capa;

CREATE POLICY "cs_staff_all_capa" ON public.cs_capa
  FOR ALL TO authenticated
  USING (public.has_cs_management_role(auth.uid()))
  WITH CHECK (public.has_cs_management_role(auth.uid()));

-- ----- cs_health_scores -----
DROP POLICY IF EXISTS "CS staff full access health_scores" ON public.cs_health_scores;
DROP POLICY IF EXISTS "BI readonly health_scores" ON public.cs_health_scores;

CREATE POLICY "cs_staff_all_health_scores" ON public.cs_health_scores
  FOR ALL TO authenticated
  USING (public.has_cs_management_role(auth.uid()))
  WITH CHECK (public.has_cs_management_role(auth.uid()));

-- ----- cs_nps_campaigns -----
DROP POLICY IF EXISTS "cs_nps_campaigns_select" ON public.cs_nps_campaigns;
DROP POLICY IF EXISTS "cs_nps_campaigns_insert" ON public.cs_nps_campaigns;
DROP POLICY IF EXISTS "cs_nps_campaigns_update" ON public.cs_nps_campaigns;
DROP POLICY IF EXISTS "cs_nps_campaigns_delete" ON public.cs_nps_campaigns;

CREATE POLICY "cs_nps_campaigns_select" ON public.cs_nps_campaigns
  FOR SELECT TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_campaigns_insert" ON public.cs_nps_campaigns
  FOR INSERT TO authenticated WITH CHECK (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_campaigns_update" ON public.cs_nps_campaigns
  FOR UPDATE TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_campaigns_delete" ON public.cs_nps_campaigns
  FOR DELETE TO authenticated USING (public.has_cs_management_role(auth.uid()));

-- ----- cs_nps_sends -----
DROP POLICY IF EXISTS "cs_nps_sends_select" ON public.cs_nps_sends;
DROP POLICY IF EXISTS "cs_nps_sends_insert" ON public.cs_nps_sends;
DROP POLICY IF EXISTS "cs_nps_sends_update" ON public.cs_nps_sends;
DROP POLICY IF EXISTS "cs_nps_sends_delete" ON public.cs_nps_sends;

CREATE POLICY "cs_nps_sends_select" ON public.cs_nps_sends
  FOR SELECT TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_sends_insert" ON public.cs_nps_sends
  FOR INSERT TO authenticated WITH CHECK (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_sends_update" ON public.cs_nps_sends
  FOR UPDATE TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_nps_sends_delete" ON public.cs_nps_sends
  FOR DELETE TO authenticated USING (public.has_cs_management_role(auth.uid()));

-- ----- cs_csat_surveys -----
DROP POLICY IF EXISTS "cs_csat_surveys_select" ON public.cs_csat_surveys;
DROP POLICY IF EXISTS "cs_csat_surveys_insert" ON public.cs_csat_surveys;
DROP POLICY IF EXISTS "cs_csat_surveys_update" ON public.cs_csat_surveys;
DROP POLICY IF EXISTS "cs_csat_surveys_delete" ON public.cs_csat_surveys;

CREATE POLICY "cs_csat_surveys_select" ON public.cs_csat_surveys
  FOR SELECT TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_csat_surveys_insert" ON public.cs_csat_surveys
  FOR INSERT TO authenticated WITH CHECK (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_csat_surveys_update" ON public.cs_csat_surveys
  FOR UPDATE TO authenticated USING (public.has_cs_management_role(auth.uid()));
CREATE POLICY "cs_csat_surveys_delete" ON public.cs_csat_surveys
  FOR DELETE TO authenticated USING (public.has_cs_management_role(auth.uid()));
