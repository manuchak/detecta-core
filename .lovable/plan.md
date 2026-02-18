

# Performance Historico - Graficos Comparativos MoM, WoW, QoQ, YoY

## Resumen

Agregar una seccion de graficos historicos debajo de las tarjetas de KPIs diarios en el dashboard de Performance, siguiendo el estilo visual del dashboard ejecutivo. Los graficos mostraran la evolucion de On Time %, Fill Rate % y OTIF % en diferentes horizontes temporales.

## Fuentes de datos

Los datos historicos se obtendran de:
- `servicios_planificados`: id_servicio, custodio_asignado (Fill Rate), fecha_hora_cita, hora_inicio_real (fallback puntualidad), fecha_cancelacion
- `servicios_custodia`: id_servicio, hora_presentacion (puntualidad principal), fecha_hora_cita
- `checklist_servicio`: servicio_id, estado (OTIF)

Datos disponibles: servicios_planificados desde Oct 2025, servicios_custodia con hora_presentacion desde Mar 2025. La comparacion YoY tendra datos limitados (solo 2025-2026).

## Arquitectura

### Nuevo hook: `src/hooks/usePerformanceHistorico.ts`

Un hook dedicado que calcula metricas agregadas por periodo (dia, semana, mes, trimestre). La estrategia es:

1. Traer servicios_planificados de los ultimos 12 meses (paginado para evitar el limite de 1000 rows)
2. Traer servicios_custodia del mismo rango (solo id_servicio + hora_presentacion + fecha_hora_cita)
3. Traer checklist_servicio del mismo rango (servicio_id + estado)
4. Merge por id_servicio
5. Agrupar por periodo y calcular Fill Rate %, On Time %, OTIF % por cada grupo

Retorna:
```text
{
  daily: { fecha, fillRate, onTimeRate, otifRate, total }[]        // ultimos 30 dias
  weekly: { semana, fillRate, onTimeRate, otifRate, total }[]      // ultimas 12 semanas
  monthly: { mes, year, fillRate, onTimeRate, otifRate, total }[]  // ultimos 12 meses
  quarterly: { quarter, year, fillRate, onTimeRate, otifRate }[]   // ultimos 4-6 trimestres
}
```

### Nuevos componentes de grafico

| Archivo | Descripcion |
|---|---|
| `src/components/monitoring/performance/PerformanceHistoryCharts.tsx` | Contenedor con tabs (WoW / MoM / QoQ / YoY) que renderiza el grafico apropiado |
| `src/components/monitoring/performance/PerformanceLineChart.tsx` | Componente reutilizable de LineChart con 3 series (Fill Rate, On Time, OTIF) |

### Diseno visual (inspirado en dashboard ejecutivo)

- Tabs para seleccionar horizonte: **Semanal (WoW)** | **Mensual (MoM)** | **Trimestral (QoQ)** | **Anual (YoY)**
- LineChart con 3 lineas de colores diferenciados:
  - Fill Rate: azul (primary)
  - On Time: verde (success)
  - OTIF: amber (warning)
- Eje Y: 0-100% 
- Tooltips con los 3 valores + total de servicios del periodo
- Linea de referencia punteada al 90% (target)
- Para MoM y YoY: barras agrupadas comparando mismo periodo del ano anterior (cuando haya datos)

### Modificacion: `PerformanceDashboard.tsx`

Agregar `PerformanceHistoryCharts` entre las tarjetas de metricas y las tablas de problemas.

## Layout actualizado

```text
+-------------------------------------------+
| [Fill Rate] [On Time] [OTIF]              |  <- Tarjetas existentes (hoy)
| [Checklists] [Custodios] [Svcs/Custodio]  |
+-------------------------------------------+
| Historico de Performance                   |  <- NUEVO
| [WoW] [MoM] [QoQ] [YoY]                  |
| [===== LineChart 3 series =====]          |
+-------------------------------------------+
| Clientes con problemas  | Custodios con   |  <- Tablas existentes
| de puntualidad           | problemas de    |
+-------------------------------------------+
```

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/hooks/usePerformanceHistorico.ts` | Crear - Hook con queries paginadas y calculo de metricas historicas |
| `src/components/monitoring/performance/PerformanceHistoryCharts.tsx` | Crear - Contenedor con tabs + chart |
| `src/components/monitoring/performance/PerformanceLineChart.tsx` | Crear - LineChart reutilizable con 3 series |
| `src/components/monitoring/performance/PerformanceDashboard.tsx` | Modificar - Insertar PerformanceHistoryCharts entre cards y tablas |

## Detalle tecnico del hook

### Queries (timezone CDMX)

El rango sera los ultimos 12 meses. Se usara `fetchAllPaginated` (mismo patron del dashboard ejecutivo) para evitar el limite de 1000 rows de Supabase.

```text
Query 1: servicios_planificados (12 meses)
  select: id_servicio, custodio_asignado, fecha_hora_cita, hora_inicio_real
  where: fecha_hora_cita >= 12 meses atras, fecha_cancelacion IS NULL

Query 2: servicios_custodia (12 meses)
  select: id_servicio, hora_presentacion, fecha_hora_cita
  where: fecha_hora_cita >= 12 meses atras

Query 3: checklist_servicio (12 meses)
  select: servicio_id, estado
  where: created_at >= 12 meses atras
```

### Agrupacion

Cada servicio mergeado se clasifica en su dia CDMX (usando formatInTimeZone). Luego se agrupa:
- **Daily**: ultimos 30 dias naturales
- **Weekly**: ISO week number, ultimas 12 semanas
- **Monthly**: mes/ano, ultimos 12 meses
- **Quarterly**: T1-T4/ano

Para cada grupo se calcula:
- Fill Rate = servicios con custodio_asignado / total * 100
- On Time = servicios con llegada puntual / servicios evaluables * 100
- OTIF = servicios puntuales con checklist completo / evaluables * 100

### Tolerancia On Time

Misma logica que el hook diario: hora_presentacion (o hora_inicio_real como fallback) <= fecha_hora_cita + 15 min.

### Cache

staleTime: 10 minutos, refetchInterval: 10 minutos (datos historicos no cambian tan rapido).

