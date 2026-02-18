

# Ajustar vista diaria a 15 dias y agregar benchmarks a Checklists

## Cambios

### 1. Reducir vista diaria de 30 a 15 dias (`usePerformanceHistorico.ts`)

Cambiar el calculo de `thirtyDaysAgo` a 15 dias atras. Esto reduce la cantidad de puntos en el eje X, evitando que las etiquetas y valores se superpongan.

- Linea ~13 en `PerformanceHistoryCharts.tsx`: cambiar label de `'Diario (30d)'` a `'Diario (15d)'`
- Linea ~183-185 en `usePerformanceHistorico.ts`: cambiar `setDate(... - 30)` a `setDate(... - 15)`

### 2. Agregar linea de benchmark a Checklists (`PerformanceHistoryCharts.tsx`)

Actualmente Checklists tiene `target: undefined`, por lo que no muestra linea de referencia. Cambiar a `target: 90` (mismo benchmark que las demas metricas) para que se dibuje la linea punteada de benchmark.

- Linea ~22: cambiar `target: undefined` a `target: 90`

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/hooks/usePerformanceHistorico.ts` | 30 dias -> 15 dias |
| `src/components/monitoring/performance/PerformanceHistoryCharts.tsx` | Label "Diario (15d)" + target 90 en Checklists |

## Impacto

Ninguno fuera de estos 2 archivos. Es ajuste de configuracion puro.

