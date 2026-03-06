

# Fix: 91% and stale progress bar

## Problem 1: Why 10/11 instead of 11/11

The hero percentage counts ALL 11 gates including GPS (`level: 'info'`). GPS is marked optional but still counts against the total in `EvaluationHeroStatus`:

```typescript
const passed = gates.filter(g => g.passed).length;  // 10
const percentage = (passed / gates.length) * 100;    // 10/11 = 91%
```

**Fix**: Exclude `info`-level gates from the percentage calculation. They're informational and shouldn't affect readiness score.

## Problem 2: Progress bar doesn't advance

The `CandidateStateProgress` bar reflects the **pipeline state** of the candidate (Lead → Aprobación → Evaluación → Activo), NOT the evaluation completion. It reads `currentState` which is the candidate's `estado` column in the database. If the candidate's state hasn't been updated in the pipeline (still at "Lead" or early stage), the bar stays low regardless of how much evaluation data exists.

**Fix**: This bar is redundant and confusing alongside the hero ring. Remove it — the hero ring already shows true completion progress, which is what matters here.

## Changes

| File | Change |
|---|---|
| `EvaluationHeroStatus.tsx` | Exclude `info`-level gates from percentage/total count |
| `CandidateEvaluationPanel.tsx` | Remove `CandidateStateProgress` bar (redundant with hero ring) |

