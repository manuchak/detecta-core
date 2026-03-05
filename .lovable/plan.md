

# Apple-Inspired Bitácora Board Redesign

## Critical Issues Found

### 1. Zoom 0.7 Layout Bug
`BitacoraBoard.tsx` line 47 uses `h-[calc(100vh-220px)]` but the app has `zoom: 0.7` globally. The CSS already defines `--content-height-with-tabs` which compensates. The board isn't using it, so the columns don't fill the screen.

### 2. Visual Noise Assessment
Looking at the screenshot: dark black "Reportar" buttons dominate every card, 5 event icons on every card create visual clutter, card borders add weight, and the timer (the most important element) gets lost in a small badge. The overall impression is heavy and industrial, not clean and calm.

## Design Philosophy: "Calm Operations Center"

Inspired by Apple's design principles and operational dashboard best practices:

- **Progressive disclosure**: Hide secondary actions until hover/interaction
- **Typography as hierarchy**: The timer number IS the card — large, monospaced, color-coded
- **Reduced chrome**: No card borders, use subtle background tints instead
- **Single dominant action**: "Reportar" becomes a subtle ghost button; its presence is constant but not screaming
- **Color only for meaning**: Green = healthy, amber = attention, red = act now. Everything else is grayscale

## New Card Anatomy

```text
┌──────────────────────────────────┐
│                            87m   │  ← Timer: large (text-lg), right-aligned, color = urgency
│ FABRICAS DE CALZADO ANDREA       │  ← Client name: medium weight, truncated
│ Alan Armando · Tultitlan → CDMX  │  ← Custodio · route, muted
│ FAEAFCA-171    ○ Reportar    ⋯   │  ← Folio left, ghost CTA center, overflow right
└──────────────────────────────────┘
```

- No visible border (or 1px very subtle). Background slightly elevated.
- Timer is the FIRST thing the eye hits: `text-xl font-mono tabular-nums` in urgency color
- Event icons are HIDDEN — accessed via the ⋯ overflow menu along with "Llegada a Destino"
- Card height target: ~80px (4 tight lines)
- Hover state: subtle lift/shadow

## Pending Card (Simplified)

```text
┌──────────────────────────────────┐
│ AW SPORTS              En 12min  │
│ Pablo Armando · Puebla → Cuaut.  │
│                        Iniciar → │
└──────────────────────────────────┘
```

- 3 lines only. "Iniciar" is a text button, not a full-width dark block.

## Implementation

### File 1: `BitacoraBoard.tsx`
- Replace `h-[calc(100vh-220px)]` with `h-[var(--content-height-with-tabs)]` to fix the zoom viewport bug

### File 2: `ServiceCardActive.tsx`
- Timer becomes hero element: `text-xl font-mono` with urgency color, positioned top-right
- Client name: `text-sm font-medium` — the identifying info
- Custodio + route: single muted line
- Bottom row: folio (tiny mono), ghost "Reportar" button, ⋯ dropdown containing event icons + Llegada
- Remove explicit Card border, use `bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors`
- Alert states: only border-left color bar (2px) for warning/critical, not full border + shadow

### File 3: `ServiceCardPending.tsx`
- 3 lines: client+timer, custodio+route, text-only "Iniciar" action
- Remove full-width dark button
- Use same borderless card style

### File 4: `BoardColumnEnCurso.tsx`
- Reduce gap from `gap-2` to `gap-1.5` for tighter grid
- Column header becomes minimal: just text + count, no icon

### File 5: `BoardColumnPorIniciar.tsx`
- Same header simplification

### File 6: `BoardColumnEventoEspecial.tsx`
- Same header simplification

| File | Action |
|---|---|
| `src/components/monitoring/bitacora/BitacoraBoard.tsx` | Fix viewport height variable |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Timer-hero, borderless, progressive disclosure |
| `src/components/monitoring/bitacora/ServiceCardPending.tsx` | 3-line minimal card |
| `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx` | Tighter grid, minimal header |
| `src/components/monitoring/bitacora/BoardColumnPorIniciar.tsx` | Minimal header |
| `src/components/monitoring/bitacora/BoardColumnEventoEspecial.tsx` | Minimal header |

