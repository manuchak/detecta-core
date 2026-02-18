

# Ajustar benchmarks individuales por metrica

Cambio de configuracion en `src/components/monitoring/performance/PerformanceHistoryCharts.tsx`, lineas 19-22 del array `metrics`:

| Metrica | Target actual | Target nuevo |
|---|---|---|
| Fill Rate | 90% | **99%** |
| On Time | 90% | **95%** |
| OTIF | 90% | **95%** |
| Checklists | 90 | **100%** (pendiente de aplicar) |

Cambios en 4 valores del array `metrics`:
- `fillRate`: `target: 90` -> `target: 99`
- `onTimeRate`: `target: 90` -> `target: 95`
- `otifRate`: `target: 90` -> `target: 95`
- `checklistsRate`: `target: 90` -> `target: 100`

Un solo archivo afectado: `src/components/monitoring/performance/PerformanceHistoryCharts.tsx`

