

# Migrar pestaña Costos de KPI Dashboard a Supply Dashboard

## Cambios

### 1. `src/pages/Dashboard/KPIDashboard.tsx`
- Eliminar imports de `ExpenseForm`, `ExpensesList`, `ExpenseMetricsCards`, `ExpenseDistributionChart`
- **Desktop**: Eliminar la pestaña "Costos" del `TabsList` (pasar de 7 a 6 columnas `grid-cols-6`) y su `TabsContent value="costos"`
- **Mobile**: En el tab `kpis-cost`, eliminar la sección de Costos (separador + los 4 componentes de expense), renombrarlo a solo `kpis`
- Actualizar `MOBILE_TAB_MAP`: eliminar la entrada `costos: 'kpis-cost'` y cambiar `kpis: 'kpis-cost'` a `kpis: 'kpis'`
- Limpiar imports no usados (`DollarSign`, `Separator` si ya no se usan)

### 2. `src/pages/supply/SupplyDashboardExtended.tsx`
- Agregar imports de `ExpenseMetricsCards`, `ExpenseDistributionChart`, `ExpenseForm`, `ExpensesList` y el icono `DollarSign`
- Agregar una 6ta pestaña "Costos" al `TabsList` (cambiar `grid-cols-5` a `grid-cols-6`)
- Agregar `TabsContent value="costos"` con los 4 componentes: métricas, distribución, formulario y lista

