

# Quitar "Sistema de Forecasting Avanzado" del Dashboard Principal

## Cambio

En `src/pages/Dashboard/ExecutiveDashboard.tsx`:
- Eliminar el import de `AdvancedForecastDashboard`
- Eliminar `<AdvancedForecastDashboard />` de la grilla (línea 509), dejando solo `<AnnualComparisonCard />` en esa sección

La tarjeta de Forecasting Avanzado ya es accesible desde la pestaña "Calibración" en KPIs, por lo que el acceso directo desde el dashboard principal es redundante.

## Archivo a modificar
- `src/pages/Dashboard/ExecutiveDashboard.tsx`

