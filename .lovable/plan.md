

# Conectar gráfico de tendencia a datos reales de monitoreo

## Problema

El gráfico "Tendencia 7d" en el tab Ops del KPIDashboard calcula Fill Rate y On-Time desde `servicios_custodia` usando un campo `tiempo_retraso` que no existe, resultando en On-Time siempre 0%. Los datos reales ya están disponibles en `usePerformanceHistorico` que cruza correctamente `servicios_planificados` + `servicios_custodia.hora_presentacion` + `checklist_servicio` con tolerancia de 15 minutos.

## Solución

Reemplazar la fuente de datos del gráfico de tendencia en `OperationalOverview` para usar `usePerformanceHistorico` en lugar de `metrics.dailyTrend`.

### Cambios

**`src/components/executive/OperationalOverview.tsx`**
- Importar `usePerformanceHistorico` 
- Llamar el hook y extraer `daily` (últimos 15 días con Fill Rate, On-Time, OTIF reales)
- Mapear `daily` al formato `DailyTrendData` que espera `DoDTrendChart`: `{ fecha, fechaLabel, solicitados: total, realizados, fillRate, aTiempo, conRetraso, otpRate: onTimeRate }`
- Pasar estos datos al `<DoDTrendChart>` en lugar de `metrics.dailyTrend`
- Usar `fillRateTarget={95}` y `otpTarget={95}` (metas del negocio según memory)

**Sin cambios en `DoDTrendChart.tsx`** — el componente visual ya funciona, solo necesita datos correctos.

### Resultado
- Fill Rate calculado como `custodios asignados / total planificados` (real)
- On-Time calculado como `hora_presentacion <= fecha_hora_cita + 15min` (real)
- Datos de últimos 15 días desde `servicios_planificados` (fuente canónica de monitoreo)

## Archivo a modificar
- `src/components/executive/OperationalOverview.tsx`

