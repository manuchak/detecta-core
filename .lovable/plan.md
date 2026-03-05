

## Analysis: Current UX Problems

The current ticket management view is a **flat table** that forces Daniela to mentally track ticket states. Key pain points:

1. **No workflow visibility** -- All tickets appear in a single list regardless of status. Daniela cannot see at a glance how many tickets are waiting for her response vs waiting for custodian validation.
2. **Missing "awaiting response" state** -- The current statuses (abierto, en_progreso, resuelto, cerrado) don't distinguish between "I responded, waiting for custodian" and "custodian replied, I need to act." This is the core workflow gap.
3. **No visual pipeline** -- Unlike Zendesk/Intercom, there's no spatial representation of ticket lifecycle progression.
4. **SLA urgency buried in columns** -- SLA badges exist but don't create the visceral urgency a Kanban layout provides.

## Design: Ticket Kanban Board (Zendesk-inspired)

### Column Structure (4 lanes)

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  🔴 Nuevos   │ │ 🟡 En curso  │ │ 🟢 Resueltos │ │ ⚪ Cerrados  │
│   (abierto)  │ │ (en_progreso)│ │  (resuelto)  │ │  (cerrado)   │
├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ ┌──────────┐ │ │ ┌──────────┐ │ │              │ │              │
│ │ Card     │ │ │ │ Card     │ │ │              │ │              │
│ │ SLA bar  │ │ │ │ "Resp.   │ │ │              │ │              │
│ │ Custodio │ │ │ │  pendien"│ │ │              │ │              │
│ │ Category │ │ │ │ SLA bar  │ │ │              │ │              │
│ └──────────┘ │ │ └──────────┘ │ │              │ │              │
│ ┌──────────┐ │ │ ┌──────────┐ │ │              │ │              │
│ │ Card     │ │ │ │ Card     │ │ │              │ │              │
│ └──────────┘ │ │ └──────────┘ │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Smart Ticket Card Design

Each card shows:
- **SLA progress bar** (top, color-coded: green/yellow/red)
- **Ticket number** + **subject** (truncated)
- **Custodian name** + category icon
- **"Needs reply" indicator** -- computed by checking if the last message in `ticket_respuestas` was from the custodian (`autor_tipo = 'custodio'`). If yes, show a pulsing dot: "Esperando tu respuesta"
- **"Awaiting validation"** -- if last message was from agent, show: "Esperando respuesta del custodio"
- **Time since last activity** (relative)
- **Priority badge** (only for alta/urgente)
- Click navigates to detail page

### Sorting within columns
- Cards sorted by SLA urgency: vencidos first, then proximos, then en_tiempo
- Within same SLA status, sorted by last activity (oldest first = needs attention)

### Implementation

**New component: `src/components/tickets/TicketKanbanBoard.tsx`**
- Receives `tickets: TicketEnhanced[]` and callbacks for status change, navigation
- 4 columns, each a scrollable lane
- Drag-and-drop support using existing `@dnd-kit` (already installed) to move tickets between status columns
- Column headers show count + total SLA-breached count

**New component: `src/components/tickets/TicketKanbanCard.tsx`**
- Compact card with SLA bar, custodian name, subject, "needs reply" indicator
- Requires knowing the last responder -- will query `ticket_respuestas` grouped by ticket

**New hook logic: Last responder per ticket**
- In `useTicketsEnhanced.ts`, add a query to fetch the last response per ticket to determine "needs reply" vs "awaiting custodian" state. This is a single query:
  ```sql
  SELECT DISTINCT ON (ticket_id) ticket_id, autor_tipo, created_at
  FROM ticket_respuestas
  ORDER BY ticket_id, created_at DESC
  ```

**Modify `src/pages/Tickets/TicketsList.tsx`**
- Add a view toggle (Table | Kanban) above the ticket section
- Default to Kanban view
- Keep the existing table view as an option
- Filters (search, SLA, priority, department) apply to both views

### UX Details (Zendesk patterns)
- Column headers have a colored top border matching status
- "Needs reply" cards get a subtle left border accent (orange pulsing)
- Empty columns show a check icon with "Todo al día" message
- Card hover shows a subtle shadow lift
- Drag ghost shows a mini version of the card
- On drop, calls `updateTicketStatus` to persist the change

