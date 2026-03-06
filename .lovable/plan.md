

# Fix: Show "Liberar" CTA when candidate is 100% ready (auto-create liberación record)

## Problem

The hero CTA shows **"Sin proceso iniciado"** because there's no row in `custodio_liberacion` for this candidate. The current logic requires:
1. `canRelease` = true (no blockers) **AND**
2. `hasLiberacionRecord` = true (row exists in `custodio_liberacion`)

But the liberación record is only created from the Liberación pipeline stage — a completely separate flow. A candidate evaluated from the Evaluaciones page never gets this record, so the release button never appears, even at 100%.

The message "Sin proceso iniciado" is also confusing for a candidate who clearly has a complete evaluation.

## Solution

When all gates pass (100%) and no liberación record exists, **auto-create it** and show the "Liberar" button directly. This eliminates the need for the user to navigate to a separate pipeline stage just to create the record.

### Changes to `CandidateEvaluationPanel.tsx`

1. **Auto-create liberación record**: When `canRelease` is true but `!liberacionRecord`, automatically insert a row into `custodio_liberacion` for this `candidato_id`. Use a mutation triggered when the panel detects this state.

2. **Update `handleRelease`**: If no record exists yet, create it first, then immediately release.

### Changes to `EvaluationHeroStatus.tsx`

3. **Better CTA when no record**: Instead of the disabled "Sin proceso iniciado" button, show:
   - If `canRelease && !hasLiberacionRecord`: A green **"Iniciar y Liberar"** button that triggers auto-creation + release in one click.
   - If `!canRelease && !hasLiberacionRecord`: Show remaining blocker count (current behavior but with better copy like "Resolver N pendientes").

### Implementation detail

In `CandidateEvaluationPanel.tsx`, add a new handler `handleInitAndRelease` that:
1. Creates the `custodio_liberacion` record directly (insert into table with `candidato_id` and `estado_liberacion: 'pendiente'`)
2. Then calls `liberarCustodio` with the new record's ID
3. Pass this as the `onRelease` callback when `!hasLiberacionRecord`

This is a 2-file change with no new dependencies.

