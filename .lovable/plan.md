

# Fix: Discrepancia entre KPI de alertas y listado del Radar

## Problema raíz

**El KPI (`resumen.alerta = 2`) cuenta solo `activeServices`** (servicios en curso sin completar). **El listado (`ALERTA = 11`) filtra sobre `allServices`** que incluye `completedServices`.

Los servicios completados pasan por `computeRadarService` donde se les calcula `alertLevel` basado en su fase original (`en_curso`/`en_destino`) y su `minutesSinceLastAction`. **Después** se les sobreescribe `phase: 'completado'` pero el `alertLevel` permanece como `warning`/`critical`. El filtro del listado (`s.alertLevel === 'critical' || s.alertLevel === 'warning'`) los atrapa porque no excluye la fase `completado`.

```text
completedQuery.data → computeRadarService() → alertLevel = 'critical' (por inactividad)
                    → { ...svc, phase: 'completado' }  ← solo cambia phase, NO alertLevel
                    
allServices = [...active, ...pending, ...completed]  ← 11 con alertLevel != normal
resumen.alerta = activeServices.filter(alertLevel != normal)  ← solo 2
```

## Solución

**Archivo:** `src/hooks/useServiciosTurnoLive.ts`

Resetear `alertLevel` a `'normal'` en los servicios completados (línea 306), ya que un servicio terminado no requiere atención operativa:

```typescript
return { ...svc, phase: 'completado' as ServicePhase, alertLevel: 'normal' as AlertLevel };
```

Esto alinea el conteo del listado con el KPI de la tarjeta. Los 8 completados dejarán de aparecer como alertas.

