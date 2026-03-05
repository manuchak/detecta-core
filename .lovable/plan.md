

# UX Redesign: Bitácora Board — Lean Cards & Checkpoint-First Workflow

## Senior UX Critique of Current Design

**Verdict: The current cards are "form-heavy" instead of "action-heavy."** A monitorist managing 15+ services simultaneously needs to scan, identify urgency, and act in under 3 seconds per card. The current design fails this test:

1. **Vertical waste**: Each active card is ~220px tall. The InlineReportControl alone (2 inputs + photo strip + send button) consumes ~100px — half the card — for an action that happens maybe once every 30min per service. This is a classic case of showing the form instead of the trigger.

2. **No urgency sorting**: 1638 services in a flat grid is unusable. The monitorist's eye has no guidance. Cards MUST sort by `minutesSinceLastAction` descending so the most overdue services float to the top-left.

3. **Wrong action hierarchy**: The checkpoint/touchpoint is the #1 action (happens every 15-30min per service). It should be ONE prominent button, not three inline inputs. "Llegada a Destino" happens exactly once per service lifecycle — it should be a subtle secondary action, not a full-width green button competing for attention.

4. **Pending window too wide**: 6h shows services that aren't relevant yet. 1h is the operational window — anything beyond is noise that dilutes the monitorist's focus.

5. **Information density**: Folio + client + custodio + route is 4 lines when it could be 2. The timer badge is small when it should be the DOMINANT visual element driving the monitorist's attention.

## Redesigned Card Anatomy

### ServiceCardActive (target: ~100px height)

```text
┌─────────────────────────────────────┐
│ B4CSBGL-19    ⛽ 🚻 ☕ 🛏️ ⚠️  ⏱87m │  ← folio left, event icons center, TIMER large right
│ B4 GLOBAL · Carlos Octavio E.D.    │  ← client · custodio (single line, truncated)
│ Manzanillo → Chihuahua             │  ← route (single line)
│ [████ Reportar Checkpoint ████] ▾  │  ← PRIMARY action (full width), ▾ = "Llegada" in dropdown
└─────────────────────────────────────┘
```

- **Timer is the hero**: Large, colored badge (green/amber/red/pulsing). It's what drives scanning.
- **Event icons**: Compact row of 5 icon-only buttons, no labels. Stays on the card since they're quick toggles.
- **"Reportar Checkpoint"**: Single prominent button. Opens a **Popover** (not drawer — faster to dismiss, stays contextual to the card).
- **"Llegada a Destino"**: Moved to a small dropdown/overflow menu (⋮) or a subtle text link below. It's a once-per-lifecycle action.

### Checkpoint Popover (opens from "Reportar" button)

```text
┌──────────────────────────────┐
│  Checkpoint — B4 GLOBAL      │
│  ┌────────────────────────┐  │
│  │ Descripción...         │  │
│  └────────────────────────┘  │
│  ┌──────────┐ ┌───────────┐  │
│  │ Coords   │ │ 📍 Auto   │  │
│  └──────────┘ └───────────┘  │
│  📷 Drag/paste or click      │
│  [img][img][+]               │
│  [████ Enviar Checkpoint ████│
└──────────────────────────────┘
```

**Why Popover over Drawer**: The monitorist is working across many cards in a 2-col grid. A drawer slides in from the side and covers the board. A popover stays anchored to the card they're acting on, letting them still see the rest of the board. It's faster to open, fill, and dismiss. The popover auto-closes on outside click — perfect for rapid workflows.

## Changes to Implement

### 1. `useBitacoraBoard.ts` — Reduce window & add sorting

- Change pending window from 6h to 1h
- Sort `enCursoServices` by `minutesSinceLastAction` DESC (most urgent first)

### 2. `ServiceCardActive.tsx` — Lean redesign

- Remove `InlineReportControl` from the card body
- Restructure to 4 compact lines: header (folio + timer), client+custodio, route, actions
- Timer becomes a large right-aligned badge (the dominant visual element)
- Special event icons stay as compact icon-only row
- Replace inline form with single "Reportar" button that opens a Popover
- Move "Llegada a Destino" to a small secondary button or overflow menu (MoreVertical dropdown)

### 3. `CheckpointPopover.tsx` — New component

- Popover anchored to the "Reportar" button
- Contains: description input, coords input + geo button, photo drop zone, submit button
- Reuses all logic from current `InlineReportControl` (compress, upload, parse coords)
- Auto-closes on successful submit

### 4. `BoardColumnEnCurso.tsx` — Always 2-col, sorted

- Remove conditional `xl:grid-cols-2`, make it always `grid-cols-2`
- Services come pre-sorted from hook by urgency

### 5. `ServiceCardPending.tsx` — Compact variant

- Reduce padding, tighter layout since fewer services will show (1h window)

### 6. `ServiceCardEnDestino.tsx` — No changes needed (already lean)

## Files to modify

| File | Change |
|---|---|
| `src/hooks/useBitacoraBoard.ts` | Window 6h→1h, sort enCurso by minutesSinceLastAction DESC |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Lean 4-line card, Popover for checkpoint, overflow for Llegada |
| `src/components/monitoring/bitacora/CheckpointPopover.tsx` | New — extracted report form in Popover |
| `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx` | Always 2-col grid |
| `src/components/monitoring/bitacora/InlineReportControl.tsx` | Keep file but no longer imported by card (used by CheckpointPopover) |

