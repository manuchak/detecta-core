

## Analisis Completo: Calidad de Datos y Mejoras al Informe Historico PDF

### Diagnostico del PDF Generado (Enero 2026)

---

### PARTE A: Problemas de Layout y Presentacion

#### A1. Header solapado con contenido (visible en screenshot)

En la pagina del "Contenido del Informe", el header fijo ("detecta Informe Historico") se superpone con el titulo "Contenido del Informe". La causa es que `ReportHeader` usa `position: 'absolute'` con `top: 0` y altura de 42pt, pero el `paddingTop` de la pagina es 50pt. Cuando se combinan elementos grandes como el titulo de 20pt, el contenido sube e invade la zona del header.

**Solucion**: Aumentar `paddingTop` en `tokens.ts` de 50 a 60pt para dar mas espacio libre. Agregar `marginTop` explicito de 8pt al primer elemento despues del header en `HistoricalTableOfContents`.

#### A2. Cortes de pagina inadecuados

Varias secciones (Operacional pag 11-12, Clientes pag 14-15) cortan tablas a mitad. La tabla "Top 10 Clientes" empieza en una pagina y termina en la siguiente sin repetir cabeceras.

**Solucion**: Usar `break-inside: 'avoid'` (`minPresenceAhead`) en los `View` que contienen tablas y charts. Agregar `wrap={false}` a grupos logicos que no deben dividirse. Para tablas largas (>10 filas), dejar que fluyan pero asegurar que el `DataTable` repita su titulo en pagina nueva.

#### A3. Paginas con mucho espacio vacio

CPA (pag 4), Engagement (pag 7), Conversion (pag 9): muestran "Sin datos disponibles" con enormes areas en blanco. Esto se debe a la falta de datos, no al layout -- pero la presentacion deberia mostrar un mensaje mas informativo.

**Solucion**: Agregar un componente `EmptyDataNotice` que muestre un recuadro con explicacion de por que no hay datos y que acciones tomar.

---

### PARTE B: Problemas de Calidad de Datos (Critico)

#### B1. CPA: Costos Totales = $0, Custodios Nuevos = 0 (pero CPA Promedio = $4,052)

| Campo | Valor en PDF | Problema |
|-------|-------------|----------|
| Costos Totales | $0 | El hook `useCPADetails` filtra `gastos_externos` con rango **hardcodeado** `2025-01-01` a `2025-12-31` |
| Custodios Nuevos | 0 | Mismo filtro: busca primer servicio solo en 2025 |
| CPA Promedio | $4,052 | Viene de `overallCPA` que usa datos de 2025, no del rango filtrado |
| Detalle Mensual | "Sin datos" | `monthlyEvolution` filtrada por `year === 2026` resulta vacia porque los datos son de 2025 |

**Causa raiz**: `useCPADetails.ts` lineas 52-53 tienen fechas hardcodeadas a 2025. Cuando el usuario genera un reporte de Enero 2026, el filtro en `transformCPAData` (linea 274) filtra `itemYear === year` (2026), pero los datos vienen del query de 2025. Resultado: array vacio.

**Solucion**: El hook debe recibir `year` como parametro y ajustar las queries dinamicamente. El CPA Promedio ($4,052) refleja el acumulado historico y debe discriminarse del periodo solicitado.

#### B2. Engagement: 11,401 servicios pero "Sin datos disponibles" en detalle mensual

| Campo | Valor | Problema |
|-------|-------|----------|
| Total Servicios | 11,401 | Correcto - suma historica |
| Detalle Mensual | "Sin datos" | `useEngagementDetails.ts` linea 41: filtra `2025-01-01` a `2025-12-31` hardcodeado |

**Causa raiz**: Identica a CPA. El query trae datos de 2025, pero `transformEngagementData` (linea 399) filtra `itemYear === 2026`. Tabla vacia.

#### B3. Conversion: 8,930 leads pero "Sin datos disponibles" en detalle

| Campo | Valor | Problema |
|-------|-------|----------|
| Total Leads | 8,930 | Acumulado desde julio 2025 |
| Detalle Mensual | "Sin datos" | `useConversionRateDetails` genera meses con label tipo "Enero" (sin ano), pero el transform filtra por `itemYear === 2026` sobre `m.month` |

**Causa raiz**: El `monthlyBreakdown` del hook de conversion usa nombres de mes ("Enero") en vez de formato "2026-01", asi que `parseInt(m.month.split('-')[0])` devuelve `NaN` y el filtro falla.

#### B4. LTV: Solo tiene datos Q2-Q3 2025, no 2026

El hook `useLTVDetails.ts` linea 88 filtra `fecha >= 2025-06-01 && fecha <= 2025-08-31` hardcodeado. No hay datos de 2026.

**Solucion**: Todos los hooks de detalle deben aceptar `year` y opcionalmente `month` para filtrar datos del periodo correcto.

#### B5. Operacional: Top 10 Custodios por Cobro = "Sin datos disponibles"

El `useOperationalMetrics` SI acepta `year/month` como parametros y los usa para filtrar. Sin embargo, los `topCustodians` solo muestran custodios con `costo_custodio > 0` del mes actual (MTD). Cuando el reporte es de Enero 2026 y se genera en Febrero, el filtro de "mes actual" no coincide con el periodo solicitado.

**Causa raiz**: `topCustodians` se calcula desde datos del mes en curso (MTD), no del periodo del reporte.

#### B6. Clientes: GMV por tipo de servicio = $0

La tabla "Analisis por Tipo de Servicio" muestra Foraneo: 524 servicios, $0 GMV y Local: 540 servicios, $0 GMV. Los `avgValue` ($14,229 y $2,490) existen pero el GMV total es $0.

**Causa raiz**: `serviceTypeAnalysis` en `useClientAnalytics` no calcula GMV por tipo de servicio correctamente. El campo `gmv` del type analysis no se alimenta de los datos reales.

#### B7. Proyecciones: 11 meses con Forecast=0, Real=0

Solo Enero tiene datos (Forecast: 798, Real: 725). El resto del ano muestra ceros porque `transformProjectionsData` itera `monthlyBreakdown` que es un array de un solo mes (Enero). Los meses Feb-Dic se rellenan con ceros en vez de usar datos del forecast engine real.

**Causa raiz**: Las proyecciones no usan `useAdvancedForecastEngine` ni `useEnsembleForecast` que SI existen en el codebase. Se calculan con una formula simplista (`forecast = real * 1.1`).

---

### PARTE C: Plan de Correccion

#### Fase 1: Parametrizar hooks con ano/mes dinamico (impacto critico)

Los siguientes 4 hooks tienen fechas hardcodeadas y necesitan recibir `year` como parametro:

| Hook | Lineas con hardcode | Cambio |
|------|-------------------|--------|
| `useCPADetails.ts` | L52-53: `2025-01-01` / `2025-12-31` | Recibir `year` en options, construir rango dinamico |
| `useEngagementDetails.ts` | L41-42: `2025-01-01` / `2025-12-31` | Recibir `year` en options |
| `useLTVDetails.ts` | L88: `2025-06-01` / `2025-08-31` | Recibir `year`, expandir rango a todo el ano |
| `useConversionRateDetails.ts` | L39: `new Date(2025, 6, 1)` | Recibir `year`, calcular inicio dinamico |

#### Fase 2: Pasar `config.year` y `config.month` a los hooks

En `useHistoricalReportData.ts`, los hooks que lo necesiten deben recibir el ano del config:

```text
useCPADetails({ enabled, year: config.year })
useEngagementDetails({ enabled, year: config.year })
useLTVDetails({ enabled, year: config.year })
useConversionRateDetails({ enabled, year: config.year })
```

#### Fase 3: Corregir transforms con formatos de mes inconsistentes

- `transformConversionData`: El `monthlyBreakdown` usa nombres ("Enero") en vez de "2026-01". Cambiar el hook para devolver formato ISO o adaptar el filtro.
- Estandarizar formato `YYYY-MM` en todos los hooks para que el filtro `itemYear === year` funcione.

#### Fase 4: Integrar forecast real en Proyecciones

Reemplazar la formula simplista `forecast = real * 1.1` en `transformProjectionsData` por datos del hook `useAdaptiveHybridForecast` o `useEnsembleForecast` que ya existen y generan proyecciones mensuales reales basadas en modelos Holt-Winters.

#### Fase 5: Corregir datos vacios especificos

| Seccion | Dato vacio | Correccion |
|---------|-----------|-----------|
| Operacional - Top Custodios | "Sin datos" | Filtrar por `year/month` del reporte, no por MTD actual |
| Clientes - GMV por Tipo | $0 | Calcular GMV sumando `cobro_cliente` por tipo en `useClientAnalytics` |
| Operacional - topCustodians | Solo con `costo_custodio > 0` | Mostrar top por servicios/GMV aunque no tengan costo registrado, agregar nota |

#### Fase 6: Mejoras de layout PDF

| Mejora | Archivo | Cambio |
|--------|---------|--------|
| Padding top | `tokens.ts` | `paddingTop: 50` a `60` |
| Anti-overlap | `HistoricalTableOfContents.tsx` | `marginTop: 8` al titulo |
| Page breaks | Todas las secciones | Envolver charts + tablas en `<View wrap={false}>` o `minPresenceAhead={100}` |
| Empty state | Nuevo: `EmptyDataNotice.tsx` | Componente que reemplaza "Sin datos disponibles" con mensaje explicativo |
| DataTable | `DataTable.tsx` | Agregar `break-inside: avoid` a filas de cabecera |

---

### Resumen de impacto

| Categoria | Archivos a modificar | Prioridad |
|-----------|---------------------|-----------|
| Hooks de datos (hardcoded years) | 4 hooks + useHistoricalReportData | CRITICA - Sin esto, reportes 2026+ estan vacios |
| Formato de meses (conversion) | useConversionRateDetails + transform | ALTA |
| Proyecciones reales | transformProjectionsData | ALTA |
| Top custodians / Client GMV | useOperationalMetrics, useClientAnalytics | MEDIA |
| Layout / page breaks / header overlap | tokens.ts, DataTable, secciones | MEDIA |
| Empty state component | Nuevo componente | BAJA |

Total: ~12 archivos a modificar, 1 nuevo componente. La mayor parte del esfuerzo es en corregir los hooks de datos para que sean dinamicos con respecto al ano.

