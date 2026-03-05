

## UI Evaluation -- Issues Identified

Looking at the screenshot with expert eyes, there are 5 concrete problems:

### 1. Category icons rendered as raw text characters
The `categoria_custodio.icono` field stores emoji/text (e.g. "💲") and is rendered inline at `text-[10px]` -- at that size emojis render inconsistently across browsers and look like garbled symbols. The "DollarSign" category icon appears as a small unreadable character next to "Pagos y Comis...".

### 2. Custodian names unreadable
- Many cards show raw phone numbers (`+52 813 544 8899`) instead of names -- this is a data issue (no `custodio.nombre` resolved), but the UI should handle it better by formatting phone numbers readably.
- The `max-w-[100px]` truncation cuts names too aggressively. On a card that's ~280px wide, there's room for more.
- The `User` icon at `h-2.5 w-2.5` (10px) is nearly invisible.

### 3. Cards don't use full column width
The footer row crams custodian + category + timestamp into tiny truncated spans. The category name truncates at `max-w-[80px]` which makes "Pagos y Comisiones" show as "Pagos y Comis...".

### 4. Font sizes too small
Nearly everything in the footer is `text-[10px]` (approximately 8px rendered). At normal zoom this is already at the limit of legibility. At 0.7x zoom it becomes unreadable.

### 5. Visual hierarchy is flat
The custodian name (the person who raised the ticket) should be prominent -- it's a key identifier. Currently it's the same size and color as the category and timestamp.

---

## Plan: Fix card readability and space usage

### File: `src/components/tickets/TicketKanbanCard.tsx`

1. **Custodian name -- make it prominent**: Move custodian name to its own line right below the subject. Use `text-xs font-medium text-foreground` (not muted). Increase icon to `h-3 w-3`. Remove `max-w-[100px]` truncation -- let it use the full card width.

2. **Format phone numbers**: When `custodianName` is a phone number (starts with `+` or is digits only), format it as a readable phone number. Add a small `Phone` icon instead of `User` icon for phone-only entries.

3. **Category + timestamp as a separate compact footer**: Move category and timestamp to a final row. Use `text-[11px]` instead of `text-[10px]`. Remove the emoji icon for categories -- use only text. Increase `max-w` for category name to `max-w-[140px]`.

4. **Bump minimum font sizes**: Change all `text-[10px]` to `text-[11px]` for reply indicators and footer metadata. This gains ~1px rendered which matters at reduced zoom.

5. **Better card structure (3 clear rows)**:
```text
┌──────────────────────────────────┐
│ ██▓░░  22h 51m     CUS-MMC  Alta│  ← SLA bar + ticket# + priority
│ Pagos y Comisiones - Reporte    │  ← Subject (2 lines max)
│ 🔴 Esperando tu respuesta      │  ← Status (conditional)
│ 👤 Daniel García Medina         │  ← Custodian name (prominent)
│ Pagos y Comisiones · hace 39min │  ← Category + time (subtle)
└──────────────────────────────────┘
```

### File: `src/components/tickets/TicketKanbanBoard.tsx`

6. **Column min-width**: Change `min-w-[280px]` to `min-w-[260px]` so columns can flex wider on large screens instead of leaving dead space.

