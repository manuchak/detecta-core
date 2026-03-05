

# Fix: Statement Timeout on Bulk Zombie Cleanup

## Problem

The `cerrar_servicios_estancados` function loops through all 1,543 stale services in a single transaction, firing the `calcular_duracion_real` trigger on each UPDATE. This exceeds Supabase's default statement timeout (~30s).

## Solution: Batch processing with a limit parameter

Two changes:

### 1. SQL Migration — Add batch limit to both functions

Modify both RPCs to accept an optional `p_limit` parameter (default 100):

- `cerrar_servicios_estancados(p_limit int DEFAULT 100)` — processes at most `p_limit` services per call
- Keep `detectar_servicios_estancados()` as-is (read-only, fast enough)

The function will `LIMIT p_limit` in its loop query, so each invocation stays well under the timeout.

### 2. Frontend — Loop until done

Update `useStaleServiceCleanup.ts` to:
- Call the RPC in a loop (batches of 100) until `cerrados = 0`
- Show progress toast: "Cerrados X de Y..."
- Refresh the stale list after all batches complete

Update `StaleServiceCleanup.tsx` to show a progress indicator during batch processing.

| File | Change |
|---|---|
| SQL Migration | Recreate `cerrar_servicios_estancados` with `p_limit` param |
| `src/hooks/useStaleServiceCleanup.ts` | Batch loop with progress |
| `src/components/administration/StaleServiceCleanup.tsx` | Progress UI during cleanup |

