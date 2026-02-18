
# Dashboard de Performance Operativo en Monitoreo

## Resumen

Agregar una nueva tab "Performance" al modulo de Monitoreo (`/monitoring?tab=performance`) con KPIs diarios calculados en tiempo real a partir de los datos de `servicios_planificados` y `servicios_custodia`.

## Metricas a implementar

| Metrica | Definicion | Fuente de datos |
|---|---|---|
| **Fill Rate** | % de servicios con custodio asignado vs total planificados del dia | `servicios_planificados.custodio_asignado IS NOT NULL / total` |
| **On Time** | % de servicios donde el custodio llego puntual (hora llegada <= hora cita) | `hora_presentacion` (custodia) o `hora_inicio_real` (planeacion) vs `fecha_hora_cita` |
| **OTIF** | On Time + In Full: puntual Y con checklist completado | On Time AND `checklist_servicio.estado = 'completo'` |
| **Checklists completados** | Cantidad y % de servicios con checklist completo | `checklist_servicio` join con servicios del dia |
| **Custodios activos hoy** | Custodios unicos asignados a servicios del dia | `DISTINCT custodio_asignado` del dia |
| **Servicios/Custodio** | Promedio de servicios por custodio activo | Total servicios / custodios unicos |
| **Clientes con problemas On Time** | Top clientes con peor % de puntualidad | Agrupado por `nombre_cliente`, ordenado por % On Time ascendente |
| **Custodios con problemas On Time** | Top custodios con peor % de puntualidad | Agrupado por `custodio_asignado`, ordenado por % On Time ascendente |

## Logica de puntualidad (On Time)

La hora de llegada se determina con esta jerarquia:
1. `servicios_custodia.hora_presentacion` (hora real de llegada a sitio, campo principal)
2. `servicios_planificados.hora_inicio_real` (fallback: cuando planeacion marca "en sitio" en el sistema)

Se compara contra `fecha_hora_cita` usando timezone CDMX (`America/Mexico_City`). Un servicio es "On Time" si `hora_llegada <= fecha_hora_cita + 15min` (tolerancia de 15 minutos).

## Arquitectura

### Nuevo hook: `src/hooks/usePerformanceDiario.ts`

Query que trae los datos del dia actual (en CDMX) desde ambas tablas:

1. `servicios_planificados`: todos los servicios del dia (no cancelados)
2. `servicios_custodia`: join por `id_servicio` para obtener `hora_presentacion`
3. `checklist_servicio`: join por `servicio_id` para saber si tiene checklist completo

El hook calcula todas las metricas en el frontend agrupando por cliente y custodio.

### Nuevos componentes

| Archivo | Descripcion |
|---|---|
| `src/components/monitoring/performance/PerformanceDashboard.tsx` | Componente principal con las metricas cards + tablas |
| `src/components/monitoring/performance/PerformanceMetricCards.tsx` | Grid de 6 metric cards (Fill Rate, On Time, OTIF, Checklists, Custodios, Svcs/Custodio) |
| `src/components/monitoring/performance/OnTimeProblemsTable.tsx` | Tabla reutilizable para "peores clientes" y "peores custodios" |

### Modificacion: `src/pages/Monitoring/MonitoringPage.tsx`

Agregar nueva tab "Performance" al `TabsList` con su `TabsContent` correspondiente.

## Detalle tecnico

### Estructura del hook

```text
usePerformanceDiario()
  |
  +-- Query 1: servicios_planificados del dia CDMX (no cancelados)
  |     select: id_servicio, nombre_cliente, custodio_asignado, fecha_hora_cita, hora_inicio_real
  |
  +-- Query 2: servicios_custodia del dia CDMX
  |     select: id_servicio, hora_presentacion, estado
  |
  +-- Query 3: checklist_servicio del dia
  |     select: servicio_id, estado
  |
  +-- Merge por id_servicio
  +-- Calculo de metricas con timezone CDMX
  +-- Return: { metricas, problemasPorCliente, problemasPorCustodio }
```

### Tolerancia On Time

Se usa 15 minutos de tolerancia (configurable). Comparacion en UTC ya que ambos timestamps estan en UTC; no necesita conversion para la diferencia, solo para determinar "dia actual" en CDMX.

### Layout del dashboard

```text
+-------------------------------------------+
| [Fill Rate] [On Time] [OTIF]              |
| [Checklists] [Custodios] [Svcs/Custodio]  |
+-------------------------------------------+
| Clientes con problemas  | Custodios con   |
| de puntualidad           | problemas de    |
| (tabla top 10)           | puntualidad     |
|                          | (tabla top 10)  |
+-------------------------------------------+
```

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| `src/hooks/usePerformanceDiario.ts` | Crear - Hook con queries y calculos |
| `src/components/monitoring/performance/PerformanceDashboard.tsx` | Crear - Layout principal |
| `src/components/monitoring/performance/PerformanceMetricCards.tsx` | Crear - Cards de metricas |
| `src/components/monitoring/performance/OnTimeProblemsTable.tsx` | Crear - Tablas de problemas |
| `src/pages/Monitoring/MonitoringPage.tsx` | Modificar - Agregar tab "Performance" |

## Sin cambios en

- Schema de base de datos (usa datos existentes)
- Triggers o RLS
- Otros hooks o componentes existentes
