

# Rediseno UI del Centro de Tickets: Vision BI

## Diagnostico del Estado Actual

El dashboard actual tiene **17 mini-tarjetas** apiladas en 3 filas (6 KPIs + 6 SLA periodo + 5 CSAT periodo), seguidas de 2 graficos. Problemas desde la perspectiva de un disenador BI:

```text
ACTUAL (problemas)
==========================================
[KPI][KPI][KPI][KPI][KPI][KPI]        <-- 6 tarjetas, todas igual tamano
[SLA%][SLA%][SLA%][#Hoy][#Sem][#Mes]  <-- 6 mas, redundancia con fila 1
[CSAT][CSAT][CSAT][CSAT][CSAT]        <-- 5 mas, redundancia con KPI CSAT
[--- Area Chart ---][--- Pie ---]      <-- Charts basicos sin contexto
==========================================
Total: 17 tarjetas + 2 charts = ruido visual, sin jerarquia
```

**Problemas clave:**
1. **Sin jerarquia visual**: Las 17 tarjetas son del mismo tamano. No hay un "numero hero" que atrape la mirada
2. **Redundancia**: Cumplimiento SLA aparece en KPIs Y en la fila de periodos. CSAT aparece en KPIs Y en su propia fila
3. **Fragmentacion**: SLA y CSAT en filas separadas obliga al ojo a saltar. Un ejecutivo quiere ver TODO el estado de un periodo en un solo lugar
4. **Cards demasiado altas**: `p-6` con `text-4xl` en las KPIs consume mucho espacio vertical para solo 6 numeros
5. **Workload Panel colapsado por defecto**: Informacion util pero oculta

---

## Propuesta: Layout "Executive Glance"

```text
PROPUESTO
==========================================
[====== HERO: Open Tickets =====] [Resp] [CSAT]   <-- 3 KPIs hero (mas grandes)
                                                  
[--- Tabla Consolidada de Periodos ---]            <-- 1 tabla compacta reemplaza
| Periodo | Tickets | SLA% | CSAT | Resp.Prom |   <-- las 11 mini-tarjetas
| Hoy     | 0       | 100% | --   | --        |
| Semana  | 2       | 75%  | 5.0  | 2h 15m    |
| Mes     | 8       | 63%  | 5.0  | 1h 48m    |
| Q       | 11      | 64%  | 5.0  | 1h 30m    |
| Anual   | 11      | 64%  | 5.0  | 1h 30m    |

[--- Area Chart (mejorado) ---][--- Donut + Agentes ---]
==========================================
Total: 3 KPIs hero + 1 tabla + 2 charts = limpio, jerarquizado
```

---

## Cambios Especificos

### 1. Redisenar TicketSLAKPIs: De 6 tarjetas a 3 "Hero Cards"

**Archivo**: `src/components/tickets/TicketSLAKPIs.tsx`

Reducir a **3 tarjetas principales** mas grandes y con mas contexto interno:

- **Card 1 - "Tickets Activos"** (hero, ocupa mas espacio): Numero grande de tickets abiertos/en_progreso. Debajo, un mini desglose inline: `X vencidos | Y proximos | Z en tiempo` con dots de color. Esta card reemplaza las 3 tarjetas SLA individuales.
- **Card 2 - "Tiempo de Respuesta"**: Promedio 1ra respuesta como numero principal. Subtitulo con mini-sparkline o indicador vs meta (ej: "Meta: 2h").
- **Card 3 - "CSAT"**: Score actual grande. Debajo: barra de progreso de tasa de respuesta (ej: "2/11 encuestas = 18%").

Esto elimina la tarjeta "Cumplimiento SLA %" (se mueve a la tabla de periodos) y condensa 6 cards en 3 con mas informacion util.

Reducir padding de `p-6` a `p-4`, texto de `text-4xl` a `text-3xl`.

### 2. Crear Tabla Consolidada de Periodos

**Archivo nuevo**: `src/components/tickets/TicketPeriodSummaryTable.tsx`

Reemplaza las 11 mini-tarjetas (6 SLA periodo + 5 CSAT periodo) con **una sola tabla compacta**:

| Periodo | Tickets | SLA % | CSAT | Respondidas | Tiempo Resp. |
|---------|---------|-------|------|-------------|--------------|
| Hoy     | 0       | 100%  | --   | 0/0         | --           |
| Semana  | 2       | 75%   | 5.0  | 1/2         | 2h 15m       |
| Mes     | 8       | 63%   | 5.0  | 2/8         | 1h 48m       |
| Q1      | 11      | 64%   | 5.0  | 2/11        | 1h 30m       |
| 2026    | 11      | 64%   | 5.0  | 2/11        | 1h 30m       |

Caracteristicas:
- Cada fila tiene indicador de color (dot verde/amber/rojo) segun SLA compliance
- CSAT muestra estrellas mini o color segun score
- Diseno compacto con `text-sm`, filas de ~36px
- Header sticky si se expande
- Responsive: en mobile se convierte en cards apiladas (patron card-list)

Recibe los tickets crudos y calcula todo internamente (SLA, CSAT, volumen por periodo).

### 3. Mejorar Charts

**Archivo**: `src/components/tickets/TicketDashboardCharts.tsx`

- Agregar **linea de referencia** (ReferenceLine) para el promedio diario de tickets
- Mejorar tooltip con formato: "Lun 24 Feb: 2 creados, 1 resuelto"
- Agregar etiqueta de total en el pie/donut: numero central "11 tickets"
- Reducir `h-[200px]` a `h-[220px]` para dar un poco mas de respiracion al chart

### 4. Integrar en TicketsList.tsx

**Archivo**: `src/pages/Tickets/TicketsList.tsx`

- Reemplazar las 3 filas de cards (KPIs + SLAMetricsByPeriod + CSATByPeriod) con:
  1. Fila de 3 Hero KPIs (grid 1x3)
  2. Tabla consolidada de periodos
  3. Charts
- Eliminar imports de `TicketSLAMetricsByPeriod` y `TicketCSATByPeriod` (ya consolidados)
- Mover el `AgentWorkloadPanel` al lado derecho del chart de pie (en lugar de al lado de los KPIs)

### 5. Eliminar componentes redundantes

Los siguientes componentes quedan sin uso y se pueden eliminar o mantener para referencia:
- `TicketSLAMetricsByPeriod.tsx` (consolidado en tabla)
- `TicketCSATByPeriod.tsx` (consolidado en tabla)

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/tickets/TicketSLAKPIs.tsx` | Redisenar: 6 cards a 3 hero cards con desglose interno |
| `src/components/tickets/TicketPeriodSummaryTable.tsx` | **Nuevo** - Tabla consolidada Periodos x Metricas |
| `src/components/tickets/TicketDashboardCharts.tsx` | Linea de referencia, tooltip mejorado, label central en donut |
| `src/pages/Tickets/TicketsList.tsx` | Nuevo layout: Hero KPIs + Tabla + Charts. Remover imports obsoletos |

## Resultado esperado

- **17 mini-tarjetas** se reducen a **3 hero cards + 1 tabla compacta**
- Tiempo de escaneo visual: de ~8 segundos a ~3 segundos
- Cero redundancia de datos
- Layout profesional tipo Tableau/Looker con jerarquia clara
- Responsive: tabla se convierte en card-list en mobile

