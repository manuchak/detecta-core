

## Plan: Dashboard Ejecutivo Completo - Replicar Resumen BI

### Contexto

La imagen muestra un dashboard estilo Looker/BI con ~20 visualizaciones organizadas en secciones. El dashboard ejecutivo actual tiene 6 KPIs + UnifiedGMVDashboard + 3 charts en grid + Finanzas + AnnualComparison + Forecast. Necesitamos agregar ~12 nuevos componentes para cubrir los graficos faltantes.

---

### Inventario: Existente vs Faltante

| Grafico en la imagen | Existe? | Componente/Hook |
|---|---|---|
| **INDICADORES MoM** (8 KPIs) | Parcial | `ExecutiveKPIsBar` tiene 6 KPIs, faltan: Clientes Monitoring, Suscripciones Monitoring |
| **GMV Diario** (barras por dia) | NO como componente dedicado | Datos disponibles via `useForecastVsActual` pero sin chart de barras puro |
| **GMV Acc 2026 vs 2025** (card) | Parcial | `UnifiedGMVDashboard` muestra progreso pero no el comparativo acumulado simple |
| **Total Servicios Ano** (card) | NO | Dato disponible en `useYearOverYearComparison` |
| **GMV MoM** (linea multi-ano) | NO | No existe hook ni componente de GMV mensual multi-ano |
| **GMV por cliente MTD** (donut) | NO como donut | `TopClientsMTD` es barra horizontal, falta donut |
| **GMV POR Y** (barras agrupadas) | NO | Hook `useQuarterlyComparison` tiene GMV por Q, no por ano |
| **GMV POR Q** (barras agrupadas) | Parcial | `QuarterlyServicesChart` tiene servicios por Q, no GMV |
| **Servicios por Q** (barras multi-ano) | SI | `QuarterlyServicesChart` |
| **Servicios MoM 2026 vs 2025** (barras) | NO | No existe comparativo mensual de servicios |
| **Servicios Diarios** (linea) | NO en executive | Existe en `SecondaryCharts` |
| **Servicios YoY** (barras anuales) | Parcial | `AnnualComparisonCard` tiene datos, no chart de barras |
| **Comparativo MTD por dia semana** (barras agrupadas) | NO | No existe |
| **% Eventos Criticos por Q** (barras) | NO | `useIncidentesList` tiene datos de incidentes, falta agregacion quarterly |
| **AOV MoM 2026 vs 2025** (linea) | NO | AOV calculado en varios hooks, sin chart MoM dedicado |
| **AOV por cliente MTD** (barras horizontales) | NO | Datos disponibles cruzando `useTopClientsMTD` |
| **Servicios por cliente MTD** (donut) | NO | Datos en `useTopClientsMTD` pero sin donut |
| **Distribucion locales/foraneos MoM** (barras apiladas %) | Parcial | `ServiceDistributionChart` solo muestra MTD actual, no historico MoM |
| **Servicios Armados** (barras apiladas %) | NO | Datos de armados existen en `servicios_custodia.nombre_armado` |

---

### Arquitectura de la solucion

Se crearan nuevos componentes y hooks organizados en bloques logicos que repliquen fielmente la estructura del BI:

```
ExecutiveDashboard
  |-- ExecutiveKPIsBar (MODIFICAR: agregar 2 KPIs de monitoring)
  |-- CriticalAlertsBar (existente)
  |
  |-- BLOQUE 1: GMV
  |   |-- GmvDailyChart (NUEVO: barras diarias del mes)
  |   |-- GmvAccumulatedCard (NUEVO: GMV Acc YTD vs ano anterior + Total servicios ano)
  |   |-- GmvMoMChart (NUEVO: linea multi-ano 12 meses)
  |
  |-- BLOQUE 2: GMV Desgloses
  |   |-- GmvClientDonut (NUEVO: pie/donut top clientes MTD)
  |   |-- GmvByYearChart (NUEVO: barras agrupadas por ano)
  |   |-- GmvByQuarterChart (NUEVO: barras agrupadas por Q multi-ano)
  |
  |-- BLOQUE 3: Servicios
  |   |-- QuarterlyServicesChart (EXISTENTE)
  |   |-- ServicesMoMChart (NUEVO: barras mensuales 2026 vs 2025)
  |   |-- DailyServicesChart (NUEVO: linea diaria del mes)
  |
  |-- BLOQUE 4: Servicios Avanzado
  |   |-- ServicesYoYChart (NUEVO: barras anuales totales)
  |   |-- WeekdayComparisonChart (NUEVO: barras por dia de semana MTD vs anterior)
  |   |-- CriticalEventsChart (NUEVO: % eventos criticos por Q)
  |
  |-- BLOQUE 5: AOV y Clientes
  |   |-- AovMoMChart (NUEVO: linea AOV mensual 2026 vs 2025)
  |   |-- AovByClientChart (NUEVO: barras horizontales AOV top clientes)
  |   |-- ClientServiceDonut (NUEVO: donut servicios por cliente MTD)
  |
  |-- BLOQUE 6: Operacional
  |   |-- LocalForaneoMoMChart (NUEVO: barras apiladas % mensual)
  |   |-- ArmedServicesMoMChart (NUEVO: barras apiladas % con/sin armado mensual)
  |
  |-- FinancialSummaryPanel (EXISTENTE)
  |-- AnnualComparisonCard (EXISTENTE)
  |-- AdvancedForecastDashboard (EXISTENTE)
```

---

### Fase 1: Hook de datos unificado multi-ano

**Archivo nuevo:** `src/hooks/useExecutiveMultiYearData.ts`

Un unico hook que consulte `servicios_custodia` con rango de 3 anos (2023-2026) y devuelva datos pre-agregados para alimentar multiples charts sin queries redundantes:

- **Inputs:** ninguno (calcula anos dinamicamente)
- **Query:** Una sola consulta a `servicios_custodia` con `select('fecha_hora_cita, cobro_cliente, nombre_cliente, local_foraneo, nombre_armado')` filtrando desde `2023-01-01` y excluyendo cancelados
- **Outputs:**
  - `monthlyByYear`: array `[{ year, month, services, gmv, aov }]` para charts MoM
  - `quarterlyByYear`: array `[{ year, quarter, services, gmv }]` para charts por Q
  - `yearlyTotals`: array `[{ year, services, gmv, aov }]` para charts YoY
  - `dailyCurrent`: array `[{ day, services, gmv }]` para chart diario del mes actual
  - `clientsMTD`: array `[{ client, services, gmv, aov }]` top 15 clientes MTD
  - `weekdayComparison`: array `[{ weekday, currentMTD, previousMTD }]` para comparativo
  - `localForaneoMonthly`: array `[{ yearMonth, local, foraneo, localPct, foraneoPct }]`
  - `armedMonthly`: array `[{ yearMonth, armed, notArmed, armedPct }]`

Este hook reemplazara las multiples consultas individuales, reduciendo llamadas a Supabase de ~8 a 1.

---

### Fase 2: Hook de incidentes para executive

**Archivo nuevo:** `src/hooks/useIncidentesExecutive.ts`

Hook que consulte `incidentes_operativos` y agregue por trimestre:

- **Query:** `select('fecha_incidente, severidad')` de toda la tabla
- **Output:** `[{ year, quarter, total, criticos, noCriticos, tasaCriticos }]`
- Clasificacion: severidad `'critica'` o `'alta'` = critico, resto = no critico
- Calcular `% eventos criticos = criticos / totalServicios * 100` (cruzar con servicios del mismo trimestre)

---

### Fase 3: Componentes de visualizacion (14 nuevos)

Cada componente sera un `Card` con Recharts, siguiendo el patron existente de `TopClientsMTD` y `QuarterlyServicesChart`.

#### 3.1 GmvDailyChart

**Archivo:** `src/components/executive/GmvDailyChart.tsx`

- **Tipo:** `BarChart` vertical
- **Datos:** `dailyCurrent` del hook multi-ano
- **Eje X:** dias del mes (18 ene, 24 ene, etc.)
- **Eje Y:** GMV en pesos
- **Tooltip:** fecha completa + GMV formateado
- **Estilo:** barras color primary, etiquetas sobre cada barra con valor formateado

#### 3.2 GmvAccumulatedCard

**Archivo:** `src/components/executive/GmvAccumulatedCard.tsx`

- **Tipo:** Card con 2 metricas grandes
- **Contenido:**
  - "GMV Acc 2026 vs 2025": valor grande + delta en pesos y % (verde/rojo)
  - "Total servicios ano": numero grande + delta % vs ano anterior
- **Datos:** `yearlyTotals` del hook multi-ano

#### 3.3 GmvMoMChart

**Archivo:** `src/components/executive/GmvMoMChart.tsx`

- **Tipo:** `LineChart` con 3-4 series (una por ano)
- **Eje X:** meses (enero - diciembre)
- **Eje Y:** GMV (0 a 10M+)
- **Series:** linea para cada ano (2023, 2024, 2025, 2026)
- **Colores:** uno por ano, con leyenda
- **Datos:** `monthlyByYear`

#### 3.4 GmvClientDonut

**Archivo:** `src/components/executive/GmvClientDonut.tsx`

- **Tipo:** `PieChart` donut con leyenda lateral
- **Datos:** `clientsMTD` (top 10 + "Otros")
- **Etiquetas:** nombre cliente + porcentaje
- **Colores:** paleta de 10+ colores distinguibles

#### 3.5 GmvByYearChart

**Archivo:** `src/components/executive/GmvByYearChart.tsx`

- **Tipo:** `BarChart` agrupado
- **Eje X:** anos (2023, 2024, 2025, 2026)
- **Eje Y:** GMV en millones
- **Barras:** una por ano con colores distintos
- **Datos:** `yearlyTotals`

#### 3.6 GmvByQuarterChart

**Archivo:** `src/components/executive/GmvByQuarterChart.tsx`

- **Tipo:** `BarChart` agrupado (como QuarterlyServicesChart pero para GMV)
- **Eje X:** T1, T2, T3, T4
- **Series:** una barra por ano
- **Datos:** `quarterlyByYear`

#### 3.7 ServicesMoMChart

**Archivo:** `src/components/executive/ServicesMoMChart.tsx`

- **Tipo:** `BarChart` agrupado
- **Eje X:** meses (ene 2026 - dic 2026)
- **Series:** 2 barras (2026 vs 2025)
- **Etiquetas:** numero sobre cada barra
- **Datos:** `monthlyByYear` filtrado a los 2 anos mas recientes

#### 3.8 DailyServicesChart

**Archivo:** `src/components/executive/DailyServicesChart.tsx`

- **Tipo:** `LineChart` con puntos
- **Eje X:** dias del mes (1 feb, 3 feb, 5 feb...)
- **Eje Y:** numero de servicios
- **Etiquetas:** valor sobre cada punto
- **Datos:** `dailyCurrent`

#### 3.9 ServicesYoYChart

**Archivo:** `src/components/executive/ServicesYoYChart.tsx`

- **Tipo:** `BarChart` simple
- **Eje X:** anos
- **Eje Y:** total servicios
- **Barras:** una por ano, colores por ano
- **Datos:** `yearlyTotals`

#### 3.10 WeekdayComparisonChart

**Archivo:** `src/components/executive/WeekdayComparisonChart.tsx`

- **Tipo:** `BarChart` agrupado
- **Eje X:** dias de la semana (domingo - sabado)
- **Series:** 2 barras (MTD actual vs MTD anterior)
- **Datos:** `weekdayComparison`

#### 3.11 CriticalEventsChart

**Archivo:** `src/components/executive/CriticalEventsChart.tsx`

- **Tipo:** `BarChart` agrupado
- **Eje X:** T1, T2, T3, T4
- **Series:** una barra por ano (% eventos criticos)
- **Formato Y:** porcentaje
- **Datos:** hook `useIncidentesExecutive`
- **Colores:** rojo/naranja para criticos

#### 3.12 AovMoMChart

**Archivo:** `src/components/executive/AovMoMChart.tsx`

- **Tipo:** `LineChart` con 2 series
- **Eje X:** meses
- **Series:** AOV 2026 vs AOV 2025
- **Datos:** `monthlyByYear` usando el campo `aov`

#### 3.13 AovByClientChart

**Archivo:** `src/components/executive/AovByClientChart.tsx`

- **Tipo:** `BarChart` horizontal
- **Eje Y:** nombres de clientes (top 8-10)
- **Eje X:** AOV en pesos
- **Datos:** `clientsMTD` ordenados por AOV

#### 3.14 ClientServiceDonut

**Archivo:** `src/components/executive/ClientServiceDonut.tsx`

- **Tipo:** `PieChart` donut con leyenda lateral
- **Datos:** `clientsMTD` por numero de servicios (no GMV)
- **Etiquetas:** cliente + porcentaje

#### 3.15 LocalForaneoMoMChart

**Archivo:** `src/components/executive/LocalForaneoMoMChart.tsx`

- **Tipo:** `BarChart` apilado 100%
- **Eje X:** meses (feb 2025, ene 2026, etc.)
- **Series apiladas:** Local %, Foraneo %, (Foraneo Corto %, Reparto % si existen)
- **Formato:** porcentaje
- **Datos:** `localForaneoMonthly`

#### 3.16 ArmedServicesMoMChart

**Archivo:** `src/components/executive/ArmedServicesMoMChart.tsx`

- **Tipo:** `BarChart` apilado 100%
- **Eje X:** meses
- **Series:** Con armado (TRUE) vs Sin armado (FALSE)
- **Formato:** porcentaje
- **Datos:** `armedMonthly`

---

### Fase 4: Modificar ExecutiveKPIsBar

**Archivo:** `src/components/executive/ExecutiveKPIsBar.tsx`

Agregar 2 KPIs adicionales al grid:

| KPI | Fuente |
|-----|--------|
| Clientes Monitoring | Contar clientes distintos con servicios de monitoring activos (requiere campo en tabla o filtro especifico) |
| Suscripciones Monitoring | Contar suscripciones activas de monitoring |

Si no hay tabla de monitoring especifica, mostrar "No corresponde" como en la imagen original, pero dejar la estructura lista para cuando los datos esten disponibles. Cambiar grid de `lg:grid-cols-6` a `lg:grid-cols-8`.

---

### Fase 5: Reorganizar ExecutiveDashboard

**Archivo:** `src/pages/Dashboard/ExecutiveDashboard.tsx`

Reestructurar el layout para organizar los componentes en bloques que repliquen la estructura de la imagen:

```
Seccion 1: KPIs Bar (8 metricas)
Seccion 2: GMV Principal (3 cols: GmvDailyChart | GmvAccumulatedCard | GmvMoMChart en linea)
Seccion 3: GMV Desgloses (3 cols: GmvClientDonut | GmvByYearChart | GmvByQuarterChart)
Seccion 4: Servicios (3 cols: QuarterlyServicesChart | ServicesMoMChart | DailyServicesChart)
Seccion 5: Servicios Avanzado (3 cols: ServicesYoYChart | WeekdayComparisonChart | CriticalEventsChart)
Seccion 6: AOV y Clientes (3 cols: AovMoMChart | AovByClientChart | ClientServiceDonut)
Seccion 7: Operacional (2 cols: LocalForaneoMoMChart | ArmedServicesMoMChart)
Seccion 8: Finanzas + Comparativa + Forecast (existentes)
```

---

### Fase 6: Mejoras de QuarterlyServicesChart para GMV

**Archivo:** `src/components/executive/QuarterlyServicesChart.tsx`

Expandir el hook `useQuarterlyComparison` para que tambien devuelva datos de 2023 (actualmente solo trae 2 anos). Cambiar la query para traer 3 anos.

---

### Resumen de archivos

| Tipo | Archivos | Descripcion |
|------|----------|-------------|
| Hook nuevo | `useExecutiveMultiYearData.ts` | Query unificada multi-ano |
| Hook nuevo | `useIncidentesExecutive.ts` | Incidentes agregados por trimestre |
| Componente nuevo | 16 archivos en `src/components/executive/` | Nuevos charts |
| Modificacion | `ExecutiveKPIsBar.tsx` | 2 KPIs adicionales |
| Modificacion | `ExecutiveDashboard.tsx` | Layout reorganizado |
| Modificacion | `useQuarterlyComparison.ts` | Expandir a 3 anos |

Total: 2 hooks nuevos, 16 componentes nuevos, 3 archivos modificados.
