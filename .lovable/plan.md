

## Plan: Split Dashboard and Kanban into Tabs

### Problem
The current `TicketsList` page stacks the dashboard (KPIs, charts, workload) and the Kanban/Table vertically, forcing users to scroll past analytics to reach ticket management. The Kanban board loses valuable vertical space.

### Solution
Add top-level tabs: **"Dashboard"** and **"Gestión"** (Kanban/Table). Each tab gets the full vertical space.

### Changes: `src/pages/Tickets/TicketsList.tsx`

1. **Wrap content in `<Tabs>`** with two `<TabsContent>` sections:
   - **"dashboard"** tab: Contains KPIs, period summary table, charts, and workload panel (lines 206-239)
   - **"gestion"** tab: Contains the view toggle (Kanban/Table), filters, and the ticket board/table (lines 241-575)

2. **Move shared elements above tabs**: Header, department pills, and the "Nuevo Ticket" button stay above both tabs.

3. **Tab triggers**: Use existing `TabsList`/`TabsTrigger` components with icons — `BarChart3` for Dashboard, `LayoutGrid` for Gestión.

4. **Default to "gestion"** tab since that's the primary workflow.

This is a single-file restructure of `TicketsList.tsx` — no new components needed.

