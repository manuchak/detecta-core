
# Evaluacion del Centro de Tickets: Brechas y Mejoras

## Diagnostico de la Realidad Actual

### Datos reales en la DB (11 tickets totales)

| Metrica | Valor Real | Lo que muestra el dashboard | Brecha |
|---|---|---|---|
| Tickets totales | 11 | 11 | OK |
| Con CSAT respondido | 2 de 11 (18%) | No visible en dashboard principal | **Sin visibilidad** |
| CSAT promedio | 5.0 (2 encuestas) | Solo en admin/metricas avanzadas | **Oculto** |
| Tiempo prom. 1ra respuesta | Calculable (8 tickets con respuesta) | No en tarjetas principales | **Sin tarjeta** |
| Tickets por dia | Datos dispersos (dic 2025 - feb 2026) | Grafico muestra "Sin datos" o datos parciales | **Grafico no refleja realidad** |
| cs_csat_surveys (modulo CS) | 0 encuestas | N/A | Fuente incorrecta para tickets |

### Problemas identificados en las tarjetas actuales

**Lo que HAY (4 tarjetas + 6 metricas por periodo):**
1. SLA Vencidos (activos) - OK pero ya corregido con `cumplido_tarde`
2. Proximos a vencer - OK
3. En tiempo - OK
4. Cumplimiento SLA % - OK pero sin desglose temporal

**Lo que FALTA (segun tu solicitud):**
1. **Tiempo promedio de primera respuesta** - El dato existe en `useTicketMetrics` (`avgFirstResponseTime`) pero NO se muestra en las tarjetas del Centro de Tickets
2. **Encuestas CSAT respondidas** - `calificacion_csat` existe en la tabla `tickets` (2 de 11 respondidas) pero no hay tarjeta que muestre tasa de respuesta
3. **CSAT actual con desglose temporal** - El promedio se calcula en `useTicketMetrics` pero no se expone con los cortes diario/semanal/mensual/Q/anual
4. **Tickets diarios** - El grafico `TicketDashboardCharts` recibe `ticketsByDay` desde `useTicketMetrics` pero el periodo default (3 meses) puede no cubrir bien los datos recientes, y el grafico se queda en "Sin datos" si hay pocos registros

### Causa raiz del grafico "sin datos"
El `useTicketMetrics` filtra por `startDate` (3 meses atras = dic 2025) y genera `ticketsByDay` correctamente. Sin embargo, con solo 9 dias con actividad en 3 meses, el area chart muestra puntos muy dispersos. No hay problema tecnico sino **falta de densidad de datos** y ausencia de dias con 0 tickets (gaps).

---

## Plan de Implementacion

### Tarea 1: Agregar tarjetas faltantes al "Estado del Soporte"

**Archivo**: `src/components/tickets/TicketSLAKPIs.tsx`

Expandir las 4 tarjetas actuales a **6 tarjetas** agregando:

- **Tarjeta 5: "Tiempo Resp."** - Muestra `avgFirstResponseTime` formateado (ej: "2h 15m"). Icono: `MessageCircle`. Color: azul. Subtitulo: "Promedio 1ra respuesta".
- **Tarjeta 6: "CSAT"** - Muestra promedio CSAT actual (ej: "5.0/5"). Icono: `Star`. Color: dorado/amber. Subtitulo: "2 de 11 respondidas" (tasa de respuesta).

Esto requiere pasar `ticketMetrics` como prop adicional a `TicketSLAKPIs` desde `TicketsList.tsx`.

### Tarea 2: Crear componente de CSAT por periodo

**Archivo nuevo**: `src/components/tickets/TicketCSATByPeriod.tsx`

Componente tipo tarjetas compactas (similar a `TicketSLAMetricsByPeriod`) que muestre CSAT desglosado en 5 cortes temporales:

| Periodo | Logica |
|---|---|
| Hoy | Tickets con `calificacion_csat` creados hoy |
| Semana | startOfWeek(now, lunes) hasta hoy |
| Mes | startOfMonth(now) hasta hoy |
| Trimestre (Q) | startOfQuarter(now) hasta hoy |
| Anual | startOfYear(now) hasta hoy |

Cada tarjeta muestra:
- CSAT promedio del periodo
- Encuestas respondidas / total del periodo
- Color segun score (verde >= 4, amber >= 3, rojo < 3)

### Tarea 3: Mejorar grafico de tickets diarios

**Archivo**: `src/components/tickets/TicketDashboardCharts.tsx`

Problemas actuales:
- No rellena dias sin tickets (gaps en el eje X)
- Con pocos datos se ve vacio

Solucion:
- Generar un array continuo de dias (desde hace 30 dias hasta hoy) y rellenar con 0 los dias sin actividad
- Esto muestra una linea continua realista en vez de puntos aislados
- Limitar a ultimos 30 dias para densidad visual adecuada

### Tarea 4: Integrar nuevos componentes en TicketsList.tsx

**Archivo**: `src/pages/Tickets/TicketsList.tsx`

- Pasar `ticketMetrics` a `TicketSLAKPIs` para las 2 tarjetas nuevas
- Agregar `TicketCSATByPeriod` debajo de `TicketSLAMetricsByPeriod` en la seccion de KPIs
- Layout: las 6 tarjetas SLA en grid 2x3 (mobile) / 6 columnas (desktop), seguido de la fila CSAT por periodo

### Tarea 5: Pasar tickets al componente CSAT

**Archivo**: `src/hooks/useTicketMetrics.ts`

Agregar al objeto `TicketMetrics`:
- `csatResponseRate`: porcentaje de tickets con CSAT respondido
- `csatByPeriod`: objeto con promedios por dia/semana/mes/Q/anual
- `csatResponseCount`: total de encuestas respondidas

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/tickets/TicketSLAKPIs.tsx` | Agregar 2 tarjetas: Tiempo Resp. + CSAT actual |
| `src/components/tickets/TicketCSATByPeriod.tsx` | **Nuevo** - CSAT desglosado diario/semanal/mensual/Q/anual |
| `src/components/tickets/TicketDashboardCharts.tsx` | Rellenar dias vacios en el grafico de tickets diarios |
| `src/pages/Tickets/TicketsList.tsx` | Integrar nuevos componentes y pasar props |
| `src/hooks/useTicketMetrics.ts` | Agregar metricas CSAT por periodo al calculo |

## Resultado esperado

El Centro de Tickets pasara de 4 tarjetas SLA a un panel completo con:
- 6 tarjetas de estado (SLA + Respuesta + CSAT)
- Fila de CSAT temporal (Hoy / Semana / Mes / Q / Anual)
- Grafico de tickets diarios con linea continua (30 dias)
- Visibilidad total de tasa de respuesta CSAT (2/11 = 18%)
