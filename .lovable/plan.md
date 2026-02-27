

# Optimizacion Mobile: Pagina KPIs Ejecutivos

## Diagnostico

La pagina `/dashboard/kpis` (KPIDashboard.tsx) no tiene ninguna adaptacion mobile. Los problemas principales visibles en el screenshot:

1. **Header**: Titulo `text-3xl` + descripcion + boton "Actualizar" + timestamp se amontonan horizontalmente
2. **Tabs de navegacion (7 pestanas)**: `grid-cols-7` con iconos + texto — ilegible y sin scroll, los textos se superponen ("OperacionalAdquisicionAnalisis Cli...KPIs AvanGestion deResumoEjecuCalibr...")
3. **Contenido de cada tab**: Grids de 4 columnas, tablas anchas, charts de 300px fijos — todo sin adaptacion

## Cambios por componente

### 1. KPIDashboard.tsx — Layout principal

**Header**:
- Titulo: `text-3xl` a `text-xl` en mobile
- Ocultar descripcion larga en mobile
- Mover boton "Actualizar" y timestamp debajo del titulo en stack vertical
- Ocultar timestamp en mobile (como ya se hizo en ExecutiveDashboard)

**Tabs de navegacion principal** (Proyecciones / KPIs Ejecutivos):
- En mobile: `flex w-auto` en lugar de `grid grid-cols-2`

**Tabs internas (7 pestanas)**:
- Cambiar `grid grid-cols-7` a scroll horizontal con `flex overflow-x-auto`
- En mobile: mostrar solo iconos con labels cortos (2-3 palabras max)
- Min-height 44px para touch targets
- Ocultar scrollbar con CSS (`scrollbar-hide`)

**Loading skeleton**:
- Cambiar `grid-cols-4` a `grid-cols-2` en mobile

### 2. Tab "Operacional" — OperationalOverview.tsx

**OperationalHeroBar**: Ya tiene `sm:grid-cols-2 lg:grid-cols-4` — funciona bien en mobile.

**DoDTrendChart**: Altura fija `h-[200px]` — adecuada. Sin cambios necesarios.

**Secondary KPIs grid**: `grid-cols-2 md:grid-cols-4` — ya funciona. Sin cambios.

**Grids de "Estado de Servicios" y "Top 5 Custodios"**: `grid-cols-1 lg:grid-cols-2` — ya apila. Revisar que los Progress bars con badges no se trunquen en 390px. El layout interno de cada fila (icono + texto + badge + porcentaje + progress bar) puede ser angosto — reorganizar a stack vertical cuando sea mobile.

### 3. Tab "Adquisicion" — AcquisitionOverview.tsx

**KPIs grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — ya tiene responsive basico pero `grid-cols-1` en mobile genera cards muy anchas. Cambiar a `grid-cols-2` en mobile para compactar.

**Charts**: Altura fija `height={300}` — reducir a 220px en mobile.

**PieChart labels**: Se desbordan en mobile — ocultar labels externas y mostrar solo en tooltip.

### 4. Tab "Analisis Clientes" — ClientAnalytics.tsx

**Header con botones**: `flex justify-between` — en mobile apilar verticalmente.

**Date filter**: Select de 200px + calendarios custom — funciona pero necesita `w-full` en mobile.

**Tabla de clientes**: Tabla con 8+ columnas — ilegible en mobile. Convertir a card-list en mobile (patron ya usado en StrategicPlanTracker).

**Client detail view**: Grids de `lg:grid-cols-4` — ya tienen `grid-cols-1` fallback. Charts de 300px — reducir a 220px. Monthly trend grid `xl:grid-cols-4` — reducir a `grid-cols-2` en mobile.

### 5. Tab "KPIs Avanzados" — ExecutiveMetricsGrid.tsx

**Grid**: `grid-cols-1 md:grid-cols-3 xl:grid-cols-5` — en mobile `grid-cols-1` genera cards enormes. Cambiar a `grid-cols-2` para que quepan 2 KPI cards por fila.

**KPIHeroCard**: `p-6` con `text-3xl` valor — reducir padding a `p-4` y valor a `text-2xl` en mobile.

**Separador "Capacidad Custodias"**: `text-lg` — reducir a `text-sm` en mobile.

### 6. Tab "Gestion de Costos"

Los componentes ExpenseForm, ExpensesList, ExpenseMetricsCards ya son formularios standard. Revisar que inputs tengan `h-12` (48px) para touch y que el layout no requiera scroll horizontal.

### 7. Tab "Resumen Ejecutivo"

**mainKPIs grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — cambiar a `grid-cols-2` en mobile.

**Service data grid**: `grid-cols-2 gap-4` dentro de card — funciona pero textos como "Servicios Totales" + valor pueden truncarse. Reducir font sizes.

### 8. Tab "Calibracion" — CalibrationDashboard.tsx

Componente complejo con tabs internas, tablas de backtesting y charts. Misma estrategia: scroll horizontal en tabs, charts a 220px, tablas a card-list pattern.

## Archivos a modificar

| Archivo | Cambio principal |
|---------|-----------------|
| `src/pages/Dashboard/KPIDashboard.tsx` | Header responsive, tabs scroll horizontal, skeleton grid, grids del tab Resumen |
| `src/components/executive/OperationalOverview.tsx` | Service distribution rows a stack mobile |
| `src/components/executive/AcquisitionOverview.tsx` | KPIs 2-col mobile, charts 220px, pie labels |
| `src/components/executive/ClientAnalytics.tsx` | Header stack, tabla a cards, date filter full-width, charts 220px |
| `src/components/executive/ExecutiveMetricsGrid.tsx` | Grid 2-col mobile |
| `src/components/executive/KPIHeroCard.tsx` | Padding y font-size compactos en mobile |
| `src/components/executive/CalibrationDashboard.tsx` | Tabs scroll, charts responsive |

## Patron tecnico

- Reutilizar `useIsMobile()` hook existente donde Tailwind responsive no alcance
- Reutilizar `MobileChartBlock` para secciones con multiples charts
- Todas las tabs usaran patron: `flex overflow-x-auto gap-1 scrollbar-hide` en mobile
- Sin dependencias nuevas

## Prioridad de implementacion

1. KPIDashboard.tsx (header + tabs — el problema mas visible del screenshot)
2. ExecutiveMetricsGrid + KPIHeroCard (tab mas usada)
3. OperationalOverview (segunda tab mas visitada)
4. AcquisitionOverview + ClientAnalytics
5. CalibrationDashboard (menor prioridad)

