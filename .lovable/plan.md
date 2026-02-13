
## Fix: Gráficos de Retención en Loop

### Problema
Los hooks `useCSRetentionMetrics` y `useCSLoyaltyFunnel` consultan la columna `fecha_servicio` en la tabla `servicios_custodia`, pero esa columna **no existe**. La columna correcta es `fecha_hora_cita`. Esto genera errores HTTP 400 que React Query reintenta indefinidamente, causando el loop visible.

### Cambios

**1. `src/hooks/useCSRetentionMetrics.ts`**
- Reemplazar todas las referencias a `fecha_servicio` por `fecha_hora_cita` (lineas 34, 35, 41, 49, 59, 103)
- Ajustar los filtros de fecha para considerar que `fecha_hora_cita` es timestamp (no date), usando comparacion de strings que sigue funcionando correctamente con formato ISO

**2. `src/hooks/useCSLoyaltyFunnel.ts`**
- Reemplazar `fecha_servicio` por `fecha_hora_cita` en la linea 100 (select)
- Reemplazar todas las referencias a `s.fecha_servicio` por `s.fecha_hora_cita` en las lineas 131 y 132 donde se mapean y filtran las fechas

### Resultado
Los queries de Supabase dejarán de devolver error 400, los datos cargarán correctamente, y los graficos de Retencion (Donut de Loyalty Ladder, Tendencia de Clientes Activos, KPIs) se renderizarán sin loop.
