

# Análisis y Optimización: Performance en Móvil

## Problemas detectados

Del screenshot y código:

1. **MetricCards (6 tarjetas)** — `grid-cols-2` con `p-4`, valor `text-3xl`, icono `h-5 w-5`. Cada tarjeta ocupa ~140px de alto. Las 3 filas consumen ~440px (60% del viewport) solo en métricas.

2. **Gráficas históricas** — 4 charts apilados verticalmente (`grid-cols-1` en mobile), cada uno con `height={200}`. Total: ~900px de scroll solo en gráficas. El `TabsList` de horizontes (Semanal/Mensual/Trimestral/Diario) se corta ("Diar..." truncado).

3. **Tablas de problemas** — Tabla HTML con 4 columnas (Nombre/Total/Tarde/%OnTime) sin adaptación móvil. Los nombres se truncan en `max-w-[200px]`.

## Solución

### 1. MetricCards compactas en móvil
Detectar `useIsMobile()` en `PerformanceMetricCards` y renderizar una versión condensada:
- Grid `grid-cols-3` en móvil (3 cols × 2 filas = más compacto que 2 cols × 3 filas)
- Padding `p-2.5`, valor `text-xl` (no `text-3xl`), icono `h-4 w-4`
- Eliminar subtitle en móvil para ahorrar ~30px por tarjeta
- Resultado: las 6 métricas en ~180px total vs ~440px actual

### 2. Gráficas con MobileChartBlock
Ya existe `MobileChartBlock` (tabs + swipe entre charts). Usarlo en `PerformanceHistoryCharts` cuando es móvil:
- Mostrar 1 gráfica a la vez con pills de selección (Fill Rate / On Time / OTIF / Checklists)
- Reducir altura del chart a 160px en móvil
- Hacer el TabsList de horizontes scrollable (`overflow-x-auto`)
- Resultado: ~250px vs ~900px actual

### 3. Tablas → Cards en móvil
En `OnTimeProblemsTable`, renderizar como lista de cards compactas en móvil:
- Cada fila: nombre + badge de % + indicador de tarde, en una sola línea
- Eliminar el header de tabla
- Resultado: más legible y táctil

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `PerformanceMetricCards.tsx` | Grid 3-col + sizing compacto en móvil |
| `PerformanceHistoryCharts.tsx` | Usar `MobileChartBlock` en móvil, TabsList scrollable |
| `SingleMetricChart.tsx` | Prop de height configurable para móvil |
| `OnTimeProblemsTable.tsx` | Card list en móvil |

4 archivos. La página pasaría de requerir ~4 scrolls completos a ~1.5.

