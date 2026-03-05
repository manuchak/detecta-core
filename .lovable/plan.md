

## Plan: Redesign Kanban Cards -- Lean Layout

### Current Issues
- SLA bar + ticket number + subject + reply indicator + footer + category = 6 visual sections in a small card -- too many layers
- Custodian phone number shown raw instead of resolved name
- Category tag at the bottom adds vertical noise
- Too much vertical padding between sections

### New Card Layout (top to bottom, single compact flow)

```text
┌─────────────────────────────────┐
│ 🟢 22h 54m    CUS-MMC...  Alta │  ← SLA inline with ticket # and priority
│ Pagos y Comisiones - Reporte   │  ← Subject (1-2 lines max)
│ 🔴 Esperando tu respuesta     │  ← Only if applicable
│ 👤 Juan Pérez · 💲 Pagos...   │  ← Custodian name + category inline
│                  hace 39 min   │  ← Timestamp right-aligned
└─────────────────────────────────┘
```

### Changes: `src/components/tickets/TicketKanbanCard.tsx`

1. **Merge SLA + ticket number + priority into one row**: SLA progress bar (compact), ticket number, and priority badge all inline on the first line. Removes 2 separate sections into 1.

2. **Compact footer**: Combine custodian name, category, and timestamp into a single row separated by `·`. Remove the border-top separator -- use tighter spacing instead.

3. **Custodian name resolution**: Already resolved via `ticket.custodio?.nombre || ticket.customer_name || ticket.custodio_telefono`. Also show `custodio_telefono` as secondary info when the name is available.

4. **Reduce padding**: `p-3` to `p-2.5`, reduce `mb-2` gaps to `mb-1` throughout.

5. **Keep reply indicators** but make them more compact (smaller text, tighter gap).

Single file change, no logic changes needed.

