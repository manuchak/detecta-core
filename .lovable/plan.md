

# Fishbone Analysis: Why Custodians Can't Be Released

```text
                                    ┌──────────────────────┐
                                    │ USER CAN'T RELEASE   │
                                    │ CUSTODIAN             │
                                    └──────┬───────────────┘
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
    UX/NAVIGATION                     DATA/BUG                          LOGIC
         │                                 │                                 │
 ├─ GPS tab shows infinite          ├─ 0 records in              ├─ GPS is "optional" but
 │  spinner (no data, no           │  programacion_instalaciones │  still shows as RED
 │  empty state fallback)           │  (empty table = spinner)   │  in progress bar (0%)
 │                                 │                             │
 ├─ Evaluación panel has           ├─ InstallationTab queries   ├─ Gates logic is correct:
 │  11 tabs but no "Liberar"       │  programacion_instalaciones │  GPS is GREEN (info only)
 │  CTA — user must exit           │  where tipo_contexto=       │  but user doesn't SEE
 │  and go to separate module      │  'custodio' → 0 rows →    │  the gate status clearly
 │                                 │  isLoading stays false      │
 ├─ Checklist is 1200+ lines       │  BUT no empty state msg    ├─ canLiberate only checks
 │  monolithic modal — user        │  shows "No hay instalaciones│  red gates, but user
 │  loses context                  │  programadas" — CORRECT    │  doesn't understand
 │                                 │                             │  WHY button is disabled
 └─ Progress bar shows 0% GPS     └─ Root: user sees GPS tab   │
    making user think it's            loading spinner from       └─ Missing: clear "what
    a blocker                         CandidateEvaluationPanel      blocks you" wizard
                                      NOT from LiberacionChecklist
```

## Root Cause Identified

The screenshot shows the **CandidateEvaluationPanel** (Evaluaciones Page), NOT the LiberacionChecklistModal. The GPS tab in `CandidateEvaluationPanel` uses `InstallationTab` which queries `programacion_instalaciones`. Since there are **0 records**, it correctly shows "Sin instalaciones programadas" — BUT the user sees the loading spinner while the query resolves and confuses it with a blocking issue.

**The real problem**: The user is in the wrong place. They're trying to release from the Evaluación panel which has NO release button. The actual release happens in a completely separate page (`/liberacion`). The user sees badges like "GPS ●" without clear context and assumes something is broken.

## Solution: Unified Release Wizard inside CandidateEvaluationPanel

Add a **"Liberar" tab** directly inside `CandidateEvaluationPanel` that replaces the need to navigate to the separate Liberación module. This tab shows a guided wizard with:
1. Auto-computed readiness from all existing evaluation data
2. Clear visual hierarchy of what blocks, what warns, and what's optional
3. One-click release when ready

### Changes

**1. New Component: `LiberacionWizardTab.tsx`**

A wizard-style component that:
- Fetches the `custodio_liberacion` record (or creates one on-the-fly if missing)
- Computes gates from LIVE data already loaded in other tabs (psico, toxico, docs, contracts, training, socioeconomico) — not from stale checkboxes
- Displays 3 clear sections with Apple-inspired progressive disclosure:
  - **🔴 Blockers** — Must resolve (expandable, links to the relevant tab)
  - **🟡 Warnings** — Can proceed but noted (collapsible)
  - **🟢 Ready** — Completed items (collapsed by default)
- Big green "Liberar a Planificación" button at the bottom
- If `custodio_liberacion` doesn't exist yet, auto-creates it

**2. Modify `CandidateEvaluationPanel.tsx`**

- Add a new `TabsTrigger value="liberar"` with a Rocket icon
- Position it prominently (last tab, visually distinct with accent color)
- Pass all necessary hooks data down to `LiberacionWizardTab`
- Auto-navigate to this tab when the user has all evaluations complete

**3. Fix GPS tab empty state timing**

In `InstallationTab.tsx`, the empty state already works correctly, but the `InstallationProgressBadge` returns `null` when there's no data (line 40: `if (!ultimaInstalacion) return null`). This makes it invisible — user doesn't know the status. Change to show a gray "—" badge so it's clear nothing is configured yet.

**4. Wizard Gate Logic (smart, not checkbox-based)**

Instead of relying on manual checkboxes in the old checklist, the wizard reads REAL data:

| Gate | Source | Level |
|---|---|---|
| INE uploaded & valid | `useDocumentosCandidato` → filter `ine_frente` with `estado_validacion='valido'` | RED if missing |
| Licencia uploaded & valid | `useDocumentosCandidato` → filter `licencia_frente` | RED if missing |
| Tóxico negativo | `useLatestToxicologia` → `resultado='negativo'` | RED if positive |
| Socioeconomico not desfavorable | `useLatestEstudioSocioeconomico` | RED if desfavorable |
| Psicométricos done | `useLatestEvaluacionPsicometrica` | YELLOW if missing |
| Midot done | `useLatestMidot` | YELLOW if missing |
| Contracts complete | `useContratosProgress` | YELLOW if incomplete |
| Training complete | `useCapacitacion` | YELLOW if incomplete |
| References 4/4 | ReferencesProgress | YELLOW if incomplete |
| GPS installed | `useProgramacionInstalacionesCandidato` | GREEN (info only) |

Each gate row is clickable → switches to the relevant tab to fix the issue.

**5. Simplify old LiberacionChecklistModal**

Keep it working for existing users but add a banner: "Tip: Puedes liberar directamente desde la pestaña de Evaluación del candidato."

### Files to create/modify

| File | Action |
|---|---|
| **New**: `src/components/recruitment/liberacion/LiberacionWizardTab.tsx` | Guided wizard with live gate computation |
| **Modify**: `src/components/recruitment/CandidateEvaluationPanel.tsx` | Add "Liberar" tab with Rocket icon |
| **Modify**: `src/components/leads/evaluaciones/InstallationProgressBadge.tsx` | Show "—" badge instead of null when no data |
| **Modify**: `src/components/liberacion/LiberacionChecklistModal.tsx` | Add redirect tip banner |

