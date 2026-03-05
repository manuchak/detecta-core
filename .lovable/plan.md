

## Problem

When a custodian creates a ticket, the ticket arrives in the admin panel showing "Usuario" instead of the custodian's actual name. This happens because:

1. The `createTicket` function in `useCustodianTicketsEnhanced.ts` never populates the `customer_name` column when inserting a ticket.
2. The `custodio_id` is resolved by phone number matching against `custodios_operativos`, but if the match fails (phone format mismatch, custodian not in that table), it stays `null`.
3. The admin detail view (`TicketDetailPage.tsx` line 361) cascades: `ticket.custodio?.nombre || ticket.customer_name || 'Usuario'` — both are null, so it shows "Usuario".

## Solution

Populate `customer_name` at ticket creation time using the custodian's profile data that is already available in the calling context.

### Changes

**1. `src/hooks/useCustodianTicketsEnhanced.ts`**
- Add `customer_name` to the `CreateTicketData` interface.
- Include `customer_name` in the ticket insert payload, with a fallback: resolve from the custodian profile (`profiles` table) using the authenticated user's ID if not provided.

**2. `src/components/custodian/MobileTicketWizard.tsx`**
- This component already has access to `custodianPhone` but not the profile name. It needs to receive or resolve the custodian's display name and pass it in the `createTicket` call.
- Option: The parent (`CustodianSupportPage.tsx`) already loads `useCustodianProfile()` and has `profile.display_name`. Pass the name down as a prop.

**3. `src/pages/custodian/CustodianSupportPage.tsx`**
- Pass `custodianName={profile?.display_name}` to `MobileTicketWizard`.

**4. `src/components/custodian/CreateCustodianTicketForm.tsx`** and **`src/components/custodian/InternalChatModal.tsx`**
- Same fix: pass custodian name when calling `createTicket`.

### Technical Detail

In `useCustodianTicketsEnhanced.ts`, the insert will add:

```typescript
customer_name: ticketData.customer_name || null,
```

As an additional safety net, if `customer_name` is not provided, the hook will resolve it from the authenticated user's profile:

```typescript
// Resolve customer name from auth user profile if not provided
let customerName = ticketData.customer_name || null;
if (!customerName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    customerName = profileData?.display_name || user.email?.split('@')[0] || null;
  }
}
```

This ensures the name is always populated regardless of which component calls `createTicket`, without requiring all callers to pass it explicitly.

