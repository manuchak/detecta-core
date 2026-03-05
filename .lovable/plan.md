

## Analysis: Why tickets don't identify the custodian

### Root Cause -- 3 separate problems

**Problem 1: `customer_name` is not populated on most tickets (28 of 33)**

The `createTicket` function in `useCustodianTicketsEnhanced.ts` (line 231-245) resolves `customer_name` from `profiles.display_name` using the authenticated user. This works correctly for custodians who create tickets from the app. However, tickets created via other paths (admin-created, WhatsApp-originated, old `useCustodianTickets.ts` hook) never set `customer_name`. Data confirms: only 5 of 33 custodian tickets have `customer_name` populated.

**Problem 2: `custodio_id` resolution fails due to phone format mismatch**

The `custodio_id` auto-resolve (line 219-228) queries `custodios_operativos` with `telefono.eq.${normalized}` where `normalized` is 10 clean digits (e.g. `5581802331`). But `custodio_telefono` stored in tickets has mixed formats: `"55 8180 2331"`, `"+52 813 544 8899"`, `"238 390 7682"`. When the phone in `profiles` doesn't match, the OR query fails. **17 of 33 tickets have `custodio_id = NULL`.**

**Problem 3: The display chain in `TicketKanbanCard` falls through to raw phone**

The card shows: `ticket.custodio?.nombre || ticket.customer_name || ticket.custodio_telefono`. When both `custodio` (resolved from `custodio_id`) and `customer_name` are null, it shows the raw phone string.

### The irony

The data IS there. The query on line 260 shows:
```
custodio: ticket.custodio_id ? custodios[ticket.custodio_id] : custodios[`phone:${ticket.custodio_telefono}`]
```

The phone fallback on line 179-210 queries `custodios_operativos.telefono` with the normalized phone. But `custodio_telefono` values like `"56 1780 6350"` normalize to `5617806350`, while the `custodios_operativos` table stores `5617806350` -- this SHOULD match. Let me verify the actual mismatches:

- Tickets with `custodio_id = NULL` AND `custodio_telefono` set: the phone fallback queries `.in('telefono', phones)` where phones are normalized. This should work if the custodian exists in `custodios_operativos`.
- Some custodians simply don't exist in `custodios_operativos` yet (e.g., phone `238 390 7682` or `56 1780 6350`).

### Solution Plan

Fix at **two levels**: prevent the problem at creation time, and fix the display fallback.

#### 1. Fix ticket creation: always populate `customer_name` and `custodio_id` (file: `useCustodianTicketsEnhanced.ts`)

The `custodio_id` resolution already works. The only gap is the old `useCustodianTickets.ts` hook which doesn't set either field. Since it's still used by `SupportContactModal`, update it or deprecate it.

#### 2. Fix display fallback: resolve name from `profiles` using `created_by` (file: `useTicketsEnhanced.ts`)

When `custodio.nombre` and `customer_name` are both null, use `created_by` (UUID) to look up `profiles.display_name`. This is the most reliable link since every custodian who creates a ticket is authenticated and `created_by` stores their `auth.uid()`.

**Changes in `useTicketsEnhanced.ts`**:
- Collect all `created_by` UUIDs from tickets where `custodio_id` is null and `customer_name` is null
- Batch-query `profiles` for those UUIDs
- Attach the resolved name as a fallback display name on the ticket

**Changes in `TicketKanbanCard.tsx`**:
- Update the name resolution chain: `ticket.custodio?.nombre || ticket.customer_name || creatorProfile?.display_name || formattedPhone`

#### 3. Backfill existing tickets (one-time SQL update)

Run an UPDATE to populate `customer_name` on existing tickets using `profiles.display_name` via `created_by`:

```sql
UPDATE tickets t
SET customer_name = p.display_name
FROM profiles p
WHERE t.created_by::uuid = p.id
  AND t.customer_name IS NULL
  AND t.tipo_ticket = 'custodio'
  AND p.display_name IS NOT NULL;
```

### Summary of changes

| File | Change |
|------|--------|
| `src/hooks/useTicketsEnhanced.ts` | Add `created_by` profile resolution as fallback for custodian name |
| `src/components/tickets/TicketKanbanCard.tsx` | Update name resolution chain to use creator profile fallback |
| SQL (one-time) | Backfill `customer_name` on 28 existing tickets |

