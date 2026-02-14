

## CS Workflow Improvements: Touchpoints, Staff Evaluation, NPS Automation, and CSAT

### Problem Summary

The CS module has foundational data structures but lacks critical workflow features that prevent the team from operating effectively:

1. **Touchpoints are incomplete** -- the quick modal doesn't capture who was contacted, there's no list view to review history, and follow-up actions aren't tracked visibly
2. **No CSM assignment UI** -- `csm_asignado` exists in the database but there's no way to assign/change it from the interface
3. **No staff accountability** -- no dashboard showing which CSMs are active vs. neglecting their portfolio
4. **NPS is manual-only** -- no send rules, no automation config, no tracking of who hasn't responded
5. **CSAT is only measured on complaint closure** -- no standalone satisfaction surveys

---

### Phase 1: Touchpoint Workflow Enhancement

**1a. Improve Quick Touchpoint Modal (CSCartera.tsx)**
- Add `contacto_nombre` field (text input: "Persona contactada")
- Add `siguiente_accion` field (text: "Siguiente paso")
- Add `fecha_siguiente_accion` (date picker)
- Add `duracion_minutos` (number input, optional)
- These fields already exist in the `cs_touchpoints` table but aren't captured in the UI

**1b. Add Touchpoint List Tab in Operativo (CSOperativo.tsx)**
- New tab "Touchpoints" in the Operativo section
- Table showing: fecha, cliente, tipo, direccion, contacto_nombre, resumen, siguiente_accion, created_by
- Filters: by CSM (created_by), by tipo, date range
- Highlight overdue follow-ups (fecha_siguiente_accion < today)
- New component: `CSTouchpointsList.tsx`

**1c. Pending Follow-ups Alert**
- In CSPanorama, add a KPI card: "Seguimientos pendientes" counting touchpoints where `fecha_siguiente_accion < today` and no newer touchpoint exists for that client

---

### Phase 2: CSM Assignment and Staff Evaluation

**2a. CSM Assignment from Cartera (CSCartera.tsx)**
- Add a dropdown in the client row or profile modal to assign/change `csm_asignado`
- Query `profiles` table for users with CS roles
- New hook: `useAssignCSM` mutation

**2b. CSM Performance Dashboard**
- New component: `CSStaffPerformance.tsx`
- Add as a tab in Configuracion or as a section in Panorama
- Metrics per CSM:
  - Clients assigned
  - Touchpoints registered (this month / last 30d)
  - Average days without contact across their portfolio
  - Clients in "rojo" health
  - Follow-ups overdue
  - Complaints open in their portfolio
- Ranking table sorted by activity score
- This answers: "Who is doing follow-up and who isn't?"

---

### Phase 3: NPS Automation Config

**3a. NPS Campaign Rules (CSConfigPanel.tsx)**
- New tab "NPS" in config panel
- Configurable rules stored in `cs_config` table (categoria: 'nps_rules'):
  - Frequency: quarterly / semi-annual / annual
  - Auto-select criteria: active clients, minimum services, minimum tenure
  - Channels: email, WhatsApp
  - Exclusions: clients surveyed in last N days
- Save to `cs_config` as JSON

**3b. NPS Campaign Generation**
- New component: `CSNPSCampaign.tsx` (replaces or extends CSNPSSurvey)
- "Generate Campaign" button: applies rules to select eligible clients
- Shows list of clients to survey with status: pending / sent / responded
- Manual override: add/remove clients from campaign
- Track who responded and who didn't

**3c. NPS Send Tracking**
- Add fields to `cs_nps_campaigns` or create `cs_nps_sends` table:
  - `enviado_at`, `respondido_at`, `canal_envio`, `enviado_por`
- Show response rates per campaign period

---

### Phase 4: CSAT as Standalone Metric

**4a. CSAT Survey Module**
- Currently CSAT only comes from `calificacion_cierre` on complaints
- Add new table `cs_csat_surveys` (or reuse/extend NPS approach):
  - `cliente_id`, `score` (1-5), `contexto` (post-servicio / periodico / ad-hoc), `comentario`, `servicio_id` (optional link)
- New component in Operativo: "CSAT" tab or merge with NPS as "Encuestas"
- CSAT config in CSConfigPanel: trigger rules (e.g., after every 5th service, monthly)

---

### Files to Create
- `src/pages/CustomerSuccess/components/CSTouchpointsList.tsx` -- Touchpoint history table
- `src/pages/CustomerSuccess/components/CSStaffPerformance.tsx` -- CSM performance dashboard
- `src/pages/CustomerSuccess/components/CSNPSCampaign.tsx` -- NPS campaign management
- `src/hooks/useAssignCSM.ts` -- CSM assignment mutation
- `src/hooks/useCSStaffMetrics.ts` -- Staff performance data aggregation

### Files to Modify
- `src/pages/CustomerSuccess/components/CSCartera.tsx` -- Enhance touchpoint modal, add CSM assignment
- `src/pages/CustomerSuccess/components/CSOperativo.tsx` -- Add Touchpoints tab
- `src/pages/CustomerSuccess/components/CSConfigPanel.tsx` -- Add NPS rules tab
- `src/pages/CustomerSuccess/components/CSPanorama.tsx` -- Add pending follow-ups KPI
- `src/pages/CustomerSuccess/CustomerSuccessPage.tsx` -- Add Staff tab or integrate into existing tabs
- `src/hooks/useCSTouchpoints.ts` -- Extend with follow-up queries

### Database Changes Needed
- Add columns or new table for NPS campaign tracking (`cs_nps_sends` or extend `cs_nps_campaigns`)
- Optionally add `cs_csat_surveys` table for standalone CSAT
- Both via Supabase migrations

---

### Recommended Implementation Order

1. **Phase 1** (Touchpoints) -- Quick wins, immediate operational value
2. **Phase 2** (Staff Eval) -- Accountability and management visibility
3. **Phase 3** (NPS Config) -- Process automation
4. **Phase 4** (CSAT) -- Measurement completeness

This is a large scope. I recommend starting with Phase 1 + Phase 2 first, as they address the most critical workflow gaps (who called whom, who is doing their job). Phases 3-4 build on top for process maturity.
