

# Analysis: The Evaluation Panel is NOT Apple-Inspired

Looking at the screenshot critically, there are fundamental UX problems that prevent the user from understanding where they are, what to do next, and how to release:

## Problems (Fishbone)

```text
                         USER DOESN'T KNOW WHAT TO DO
                                     │
        ┌────────────────────────────┼───────────────────────────┐
        │                            │                           │
   13 TABS OVERLOAD           NO CLEAR CTA              NO STATUS SUMMARY
        │                            │                           │
 ├─ Horizontal scroll     ├─ "Liberar" is hidden    ├─ Progress bar says
 │  hides 4+ tabs →       │  beyond scroll — user   │  "Progreso del
 │  user can't see all    │  never sees it          │  candidato" with no
 │                        │                          │  context of what's
 ├─ Category labels       ├─ Interview tab opens    │  missing
 │  ("Evaluación Core")   │  by default — shows     │
 │  are 10px, invisible   │  completed data, not    ├─ The tiny badges
 │                        │  what's PENDING          │  (●4/4, ●8/8) are
 ├─ All tabs look the     │                          │  unreadable at this
 │  same weight — no      └─ No "next step"          │  size and density
 │  visual hierarchy        guidance anywhere        │
 └─ Tab bar dominates                                └─ No blockers/warnings
    50% of visible space                                visible at first glance
```

## Solution: Replace tabs with a guided Apple-inspired layout

Instead of 13 equal-weight tabs, restructure the panel into:

**1. Hero Status Card** (always visible at top)
- Large circular progress ring (like Apple Watch rings)
- Clear text: "8 de 10 completados — 2 bloqueos"
- Primary CTA button: "Liberar" or "Resolver bloqueos" depending on state
- This replaces the generic progress bar AND the hidden Liberar tab

**2. Smart Sections with Progressive Disclosure** (replaces tab bar)
Three collapsible groups that auto-expand based on status:
- **Bloqueos** (auto-expanded if any exist, red accent) — clickable items that open inline
- **Advertencias** (collapsed if blockers exist)  
- **Completado** (always collapsed, green check count)

Each item is clickable and opens inline (accordion-style) instead of switching tabs — no context lost.

**3. Inline Detail Panels** (replaces TabsContent)
When user clicks a gate item (e.g., "Documentación — faltan 2"), the detail expands below it showing the actual DocumentsTab content inline. User resolves, collapses, moves to next.

## Implementation Plan

### A. New component: `EvaluationHeroStatus.tsx`
- Circular progress indicator (SVG ring, Apple Watch style)
- Shows: completed/total, blocker count, warning count
- Primary action button that either says "Liberar a Planificación" (green, enabled) or "Resolver X bloqueos" (scrolls to first blocker)
- Candidate name, state badge, and tipo operativo

### B. Refactor `CandidateEvaluationPanel.tsx`
Major restructure:
- Remove the 13-tab `TabsList` entirely
- Replace with: `EvaluationHeroStatus` → Sections (Blockers/Warnings/Completed) → Each item expandable inline
- Reuse ALL existing tab content components (DocumentsTab, ToxicologyTab, etc.) but render them inside collapsible sections instead of TabsContent
- Keep the `LiberacionWizardTab` gate logic but integrate it into the hero + sections directly
- Merge the gate computation from `LiberacionWizardTab` into the panel itself

### C. Remove `LiberacionWizardTab` as separate tab
Its logic gets absorbed into the panel's hero status and section layout. The release button lives in the hero card, always visible.

### Files

| File | Action |
|---|---|
| **New**: `src/components/recruitment/EvaluationHeroStatus.tsx` | Progress ring + CTA + summary |
| **Rewrite**: `src/components/recruitment/CandidateEvaluationPanel.tsx` | Replace tabs with guided sections |
| **Keep**: All existing tab content components (DocumentsTab, ToxicologyTab, etc.) | Reused inside expandable sections |

### User Flow (Apple-inspired)

1. **Open panel** → Hero shows "8/10 ✓ — 2 bloqueos" with disabled "Liberar" button
2. **Blockers section** is auto-expanded → user sees "Documentación — faltan 2 docs" and "Tóxico — sin resultado"
3. **Click "Documentación"** → DocumentsTab expands inline, user uploads docs
4. **Collapse** → blocker auto-resolves to green ✓
5. **All blockers resolved** → Hero button turns green: "Liberar a Planificación"
6. **Click** → Release happens, success modal

