

# Separar graficos historicos de Performance en paneles individuales por metrica

## Problema actual

El grafico historico de Performance muestra Fill Rate, On Time y OTIF como 3 lineas superpuestas en un solo chart. Esto dificulta leer la tendencia individual de cada metrica, especialmente cuando los valores son similares (ej. todos entre 85-100%). Ademas, la tasa de checklists no aparece en el historico.

## Solucion propuesta

Reemplazar el grafico unico de 3 lineas por **4 paneles individuales** (uno por metrica), cada uno con su propio grafico de linea y horizonte temporal seleccionable. Esto permite analizar cada KPI de forma aislada, similar al formato de la imagen de referencia.

```text
+---------------------------+---------------------------+
|  Fill Rate                |  On Time                  |
|  [Semanal] [Mensual] ... |  [Semanal] [Mensual] ... |
|  ~~~~~~~~~~~~~~~~~~~~~~~~ |  ~~~~~~~~~~~~~~~~~~~~~~~~ |
|  98.7%  99.1%  97.5%     |  91.2%  88.4%  92.0%     |
+---------------------------+---------------------------+
|  OTIF                     |  Checklists               |
|  [Semanal] [Mensual] ... |  [Semanal] [Mensual] ... |
|  ~~~~~~~~~~~~~~~~~~~~~~~~ |  ~~~~~~~~~~~~~~~~~~~~~~~~ |
|  85.3%  82.1%  88.9%     |  72.0%  78.5%  81.2%     |
+---------------------------+---------------------------+
```

## Detalles tecnicos

### 1. Extender `PeriodMetrics` para incluir checklists (hook: `usePerformanceHistorico.ts`)

Agregar `checklistsRate` al interface `PeriodMetrics` y a la funcion `computeGroupMetrics`:

- Calcular `checklistsRate = (servicios con checklist completo / total) * 100`
- El dato ya se tiene disponible porque `checklistCompleto` ya existe en `MergedService`

### 2. Crear componente `SingleMetricChart.tsx`

Un nuevo componente reutilizable que recibe:
- `data: PeriodMetrics[]` - los mismos datos actuales
- `dataKey: string` - cual metrica graficar (fillRate, onTimeRate, otifRate, checklistsRate)
- `title: string` - nombre de la metrica
- `color: string` - color de la linea
- `target?: number` - linea de referencia objetivo (ej. 90%)

Internamente usa un `LineChart` de Recharts con una sola linea, etiquetas de valor al final de cada punto, y linea de target punteada. Altura mas compacta (~200px) para que quepan 4 en grid.

### 3. Actualizar `PerformanceHistoryCharts.tsx`

Cambiar el layout de un solo chart a un grid 2x2:
- Mantener los tabs de horizonte temporal (Semanal, Mensual, Trimestral, Diario) compartidos para los 4 charts
- Cada panel es una `Card` ligera con titulo, icono de color, y el `SingleMetricChart` correspondiente
- Los 4 graficos comparten el mismo horizonte seleccionado

### 4. Archivos afectados

| Archivo | Accion | Riesgo |
|---|---|---|
| `src/hooks/usePerformanceHistorico.ts` | Agregar `checklistsRate` a `PeriodMetrics` y `computeGroupMetrics` | Bajo - campo aditivo, no modifica campos existentes |
| `src/components/monitoring/performance/SingleMetricChart.tsx` | Nuevo componente | Ninguno - archivo nuevo |
| `src/components/monitoring/performance/PerformanceHistoryCharts.tsx` | Refactorizar layout a grid 2x2 | Bajo - mismos datos, diferente presentacion |
| `src/components/monitoring/performance/PerformanceLineChart.tsx` | Sin cambios (se puede conservar o deprecar) | Ninguno |

### 5. Analisis de impacto

- **`PerformanceDashboard.tsx`**: No cambia, sigue renderizando `<PerformanceHistoryCharts />` sin props.
- **`usePerformanceDiario.ts`**: No se toca. El hook diario es independiente del historico.
- **`PeriodMetrics` interface**: Se agrega un campo opcional (`checklistsRate`), compatible hacia atras.
- **No hay cambios de BD, RLS, ni edge functions.**

