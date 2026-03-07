

# Plan: Ignorar servicios zombi en alertas del dashboard

## Diagnóstico

La query Q1 trae 15 servicios "activos" (hora_inicio_real set, hora_fin_real null). La mayoría son legítimos (hoy/ayer), pero algunos como ASCAAST-1514 (inicio 5 Mar) acumulan miles de minutos de inactividad y contaminan las alertas críticas. No todos tienen un estado cerrado en `servicios_custodia` — algunos simplemente nunca se cerraron.

## Solución

Filtrar en `useOperationalPulse.ts` al construir la lista de alertas: **excluir servicios con más de 1440 minutos (24h) de inactividad** de la sección de alertas. Estos servicios siguen visibles en el radar y en las tarjetas de fase, pero no aparecen como alertas accionables en el dashboard operativo.

## Cambio

| Archivo | Acción |
|---------|--------|
| `src/hooks/useOperationalPulse.ts` | Editar — filtro `minutesSinceLastAction <= 1440` en alertas |

En la construcción de `alertServices`, agregar condición:

```typescript
const alertServices = activeServices
  .filter(s => 
    (s.alertLevel === 'warning' || s.alertLevel === 'critical') 
    && s.minutesSinceLastAction <= 1440 // Ignorar zombis >24h
  )
```

También ajustar el conteo de `resumen.alerta` en `useServiciosTurnoLive.ts` con el mismo filtro de 1440 min para que las phase cards muestren el número correcto.

| Archivo | Acción |
|---------|--------|
| `src/hooks/useServiciosTurnoLive.ts` | Editar — filtro en `resumen.alerta` |

