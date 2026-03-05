

# Fix: "Could not find function move_lead_to_pool" error

## Root Cause

The sandbox mapper in `useSandboxAwareSupabase.ts` redirects `move_lead_to_pool` to `move_lead_to_pool_v2` and injects `p_is_test`. But the two functions have **incompatible signatures**:

| Function | Parameter | Type |
|---|---|---|
| `move_lead_to_pool` (original) | `p_estado_id` | text (e.g. "puebla") |
| `move_lead_to_pool_v2` | `p_zona_id` | uuid |

The code in `usePoolReserva.ts` passes `p_estado_id: "puebla"` (text). After sandbox mapping, PostgREST receives a call to `move_lead_to_pool_v2` with parameter names `(p_estado_id, p_is_test, p_lead_id, p_motivo)` -- but the v2 function expects `(p_lead_id, p_zona_id, p_motivo, p_is_test)`. PostgREST can't find a matching function signature and throws the error.

Additionally, the original `move_lead_to_pool` with `p_estado_id` does NOT have sandbox isolation (no `is_test` filter), and `move_lead_to_pool_v2` expects a `zona_id` UUID which is a completely different concept from the geographic state string the dialog sends.

## Solution

Create a new `move_lead_to_pool_v2` overload (or replace it) that accepts `p_estado_id text` + `p_is_test boolean`, matching what the frontend actually sends. This preserves sandbox isolation while using the correct parameter.

### Change 1: DB Migration -- Replace `move_lead_to_pool_v2`

Drop the existing `move_lead_to_pool_v2` and recreate it with the correct signature:

```sql
CREATE OR REPLACE FUNCTION public.move_lead_to_pool_v2(
  p_lead_id text,
  p_estado_id text,
  p_motivo text DEFAULT 'Zona saturada',
  p_is_test boolean DEFAULT false
) RETURNS boolean
```

The body will match the original `move_lead_to_pool` logic but add the `is_test` validation from v2.

### Change 2: `usePoolReserva.ts` -- No changes needed

The hook already passes `p_estado_id` which will now match the new v2 signature. The sandbox mapper in `useSandboxAwareSupabase.ts` correctly renames to v2 and adds `p_is_test`.

### Files

| Target | Change |
|---|---|
| DB Migration | Drop + recreate `move_lead_to_pool_v2` with `p_estado_id text` parameter |

