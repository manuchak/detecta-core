

# Add inline "Liberar" CTA on candidate rows

## Problem
When a candidate is ready to release, the user must click the row → open the full evaluation panel → find the release button. There's no shortcut on the list itself.

## Solution
Add a visible **"Liberar"** button directly on candidate rows for candidates whose evaluation is complete. Clicking it opens the `CandidateEvaluationPanel` (which already has the hero with the release CTA at the top), giving the user immediate access to the action.

We can't run the full gate computation (10+ hooks) for every row in the list — that would be N×10 queries. Instead, we'll query the `custodio_liberacion` table in bulk to identify which candidates have all gates passed, and show the CTA accordingly.

## Changes

### `EvaluacionesPage.tsx`
1. **Bulk-fetch liberación status**: Add a query to `custodio_liberacion` for all visible candidate IDs, selecting `candidato_id, estado_liberacion, documentacion_completa, psicometricos_completado, toxicologicos_completado` etc.
2. **Show inline CTA**: For candidates where the liberación record exists and all required fields are complete (or `estado_liberacion = 'aprobado_final'`), render a green **"Liberar"** button on the row that opens the panel directly.
3. **For near-ready candidates**: Show a secondary badge like "2 pendientes" that also opens the panel but communicates what's missing.

### Visual treatment
- Ready candidates: Green `Rocket` button on the right side of the row, before the chevron
- Near-ready: Amber badge showing count of missing items
- This keeps the list scannable while surfacing actionable items

