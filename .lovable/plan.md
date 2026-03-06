

# Fix: Training gate uses non-existent field

## Root Cause

**Line 129** of `CandidateEvaluationPanel.tsx`:
```typescript
const completed = progreso.filter((p: any) => p.estado === 'completado').length;
```

The `progreso_capacitacion` table has NO `estado` column. The field `p.estado` is always `undefined`, so the filter matches zero records, and `trainingComplete` is always `false`.

Meanwhile, the hook's own `calcularProgresoGeneral()` correctly checks:
```typescript
p.quiz_aprobado || (p as any).completado_manual
```

## Fix

Replace the broken `trainingComplete` computation (lines 127-131) with logic that reuses `calcularProgresoGeneral()` from the existing `useCapacitacion` hook:

```typescript
const { modulos, progreso, calcularProgresoGeneral } = useCapacitacion(candidatoId);

const trainingComplete = useMemo(() => {
  const progresoGeneral = calcularProgresoGeneral();
  return progresoGeneral?.capacitacion_completa ?? false;
}, [calcularProgresoGeneral]);
```

This uses the **same logic** that powers the `TrainingProgressBadge` (which correctly shows "Completada"), ensuring consistency.

## File changes

| File | Change |
|---|---|
| `CandidateEvaluationPanel.tsx` | Fix `trainingComplete` to use `calcularProgresoGeneral()` instead of filtering by non-existent `estado` field |

One-line fix. No new files needed.

