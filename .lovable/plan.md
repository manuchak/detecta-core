

# Fix: Duplicate Active Assignments (Simply Orange / Race Condition)

## Root Cause

The service `SIMPLY ORANGE` (Jahir) has **2 active records** in `bitacora_asignaciones_monitorista` — one for Cintia and one for Maria Fernanda. Both see it. This happens because:

1. **No DB constraint**: There's no unique partial index on `(servicio_id) WHERE activo = true`, so multiple code paths (OrphanGuard auto-assign, coordinator manual assign, rebalance) can simultaneously create active assignments for the same service.
2. **Race condition**: The app-level dedup (`UPDATE activo=false` then `INSERT`) is not atomic — between the UPDATE and INSERT, another process (OrphanGuard effect, realtime invalidation) can INSERT its own record.

The service has been reassigned **20+ times** today, bouncing between monitoristas every time OrphanGuard or BalanceGuard fires.

## Solution (2 layers)

### Layer 1: DB Unique Partial Index (prevents duplicates at source)

Create a unique partial index so PostgreSQL itself rejects a second active assignment for the same service:

```sql
CREATE UNIQUE INDEX idx_unique_active_assignment 
ON bitacora_asignaciones_monitorista (servicio_id) 
WHERE activo = true;
```

This makes all INSERT race conditions harmless — the second insert will fail.

### Layer 2: Upsert-style mutations (handle conflicts gracefully)

Update all assignment code paths to use conflict handling:

**`src/hooks/useMonitoristaAssignment.ts`**:
- `assignService`: Wrap in a transaction-like pattern — deactivate then insert with `ON CONFLICT` handling (catch unique violation and retry).
- `autoDistribute`: Before batch insert, do batch deactivate. After the unique index, any surviving duplicates will be rejected silently.
- `resetAndRedistribute`: Already deactivates all first — just add error tolerance for the insert.

**`src/hooks/useOrphanGuard.ts`**:
- Add a check before auto-assigning: skip services that already have an active assignment (they're not orphans). Currently it only checks the client-side `assignedServiceIds` Set, but stale data causes false positives.
- Add a **dedup sweep** at the beginning of each OrphanGuard cycle: query for services with `COUNT(*) > 1 WHERE activo = true`, and deactivate all but the most recent for each.

### Layer 3: Immediate data fix

Clean up the current duplicate via SQL migration:

```sql
-- Keep only the most recent active assignment per service
DELETE FROM bitacora_asignaciones_monitorista 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY servicio_id ORDER BY created_at DESC) as rn
    FROM bitacora_asignaciones_monitorista 
    WHERE activo = true
  ) sub WHERE rn > 1
);
```

## Files to modify

1. **Supabase migration** — Create unique partial index
2. **`src/hooks/useMonitoristaAssignment.ts`** — Add conflict-tolerant inserts in `assignService`, `autoDistribute`, `resetAndRedistribute`
3. **`src/hooks/useOrphanGuard.ts`** — Add dedup sweep + stricter orphan detection using fresh DB query instead of stale client state

