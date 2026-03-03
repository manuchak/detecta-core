

# Fix: SIERCP "operator does not exist: uuid = text" error

## Root cause

The `complete_siercp_assessment` RPC has **two bugs**:

1. **Type mismatch** (the error shown): The `token` column in `siercp_invitations` is type `uuid`, but `p_token` is declared as `text`. PostgreSQL cannot compare `uuid = text` without an explicit cast.

2. **Wrong column reference** (would fail next): The RPC inserts `v_invitation.candidato_id`, but `siercp_invitations` has no `candidato_id` column. The correct column is `candidato_custodio_id`.

## Fix

Create a new migration that:

1. Drops the existing function
2. Recreates it with `WHERE token = p_token::uuid` (cast text to uuid)
3. Uses `v_invitation.candidato_custodio_id` instead of `v_invitation.candidato_id` for both `candidato_id` and `evaluador_id` in the insert

### File to create

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Drop + recreate `complete_siercp_assessment` with uuid cast and correct column reference |

No frontend changes needed — the RPC signature (`p_token text`) stays the same, only the internal SQL is fixed.

