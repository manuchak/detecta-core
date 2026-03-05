

## Plan: Add shared search/filter bar to Kanban view

### Problem
The search bar and filter dropdowns (SLA, status, priority) are currently embedded inside the Table view's Card. When in Kanban mode, the user has no way to search by ticket number, custodian name, etc. -- even though `filteredTickets` is already passed to the Kanban board.

### Solution
Move the filter controls **above the view toggle** so they are shared between both Kanban and Table views.

### Changes: `src/pages/Tickets/TicketsList.tsx`

1. **Add a shared filter row** between the Gestión tab header and the view toggle (around line 254):
   - Search input (ticket number, subject, custodian name)
   - SLA, status, and priority dropdowns (desktop)
   - Mobile: search input + existing `TicketFiltersSheet` button
   - Include a results counter badge showing filtered count

2. **Remove the duplicate filter controls** from inside the Table view's Card (lines 311-398), since they'll now live above both views.

3. **Keep the filter logic unchanged** -- `filteredTickets` already applies all filters and feeds both Kanban and Table.

This is a restructure of existing UI elements within the same file. No new components or logic changes needed.

