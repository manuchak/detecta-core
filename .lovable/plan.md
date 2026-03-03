

# Diagnóstico: Checklists Rate incluye servicios futuros

## Problema confirmado

En `src/hooks/usePerformanceDiario.ts`, línea 160:

```typescript
checklistsRate: total > 0 ? Math.round((checklistsCompletados / total) * 100) : 0,
```

El denominador es `total` = **todos** los servicios del día (00:00 - 23:59 CDMX), incluyendo servicios cuya cita aún no ha pasado. Si hoy hay 47 servicios pero solo 25 ya ocurrieron, el rate muestra 25/47 = 53% en vez de 25/25 = 100%.

El mismo problema existe en `src/hooks/usePerformanceHistorico.ts`, línea 96 (`computeGroupMetrics`), aunque ahí solo afecta al día actual (días pasados ya tienen todos sus servicios vencidos).

**Comparación con On Time y OTIF**: Estos indicadores ya están protegidos naturalmente porque usan `evaluableCount` (solo cuentan servicios con `arrivalTime`), lo que excluye implícitamente servicios futuros sin llegada. Checklists no tiene esa protección.

## Plan de corrección

### Archivo 1: `src/hooks/usePerformanceDiario.ts`

**Cambio**: Filtrar servicios cuya `fecha_hora_cita` ya pasó (con tolerancia de 30 min) para el cálculo de `checklistsRate`. El numerador y denominador solo incluyen servicios "evaluables" para checklist.

```typescript
// Línea 151-160: Cambiar
const now = new Date();
const checklistEvaluable = services.filter(s => {
  if (!s.fecha_hora_cita) return false;
  return new Date(s.fecha_hora_cita).getTime() <= now.getTime();
});
const checklistsCompletados = checklistEvaluable.filter(s => s.checklist_completo).length;
// ...
checklistsRate: checklistEvaluable.length > 0 
  ? Math.round((checklistsCompletados / checklistEvaluable.length) * 100) : 0,
```

### Archivo 2: `src/hooks/usePerformanceHistorico.ts`

**Cambio**: En `computeGroupMetrics`, aplicar el mismo filtro temporal para `checklistsRate`. Para días pasados no cambia nada (todos los servicios ya vencieron). Para el día actual, excluye servicios futuros.

```typescript
const now = new Date();
const checklistEvaluable = services.filter(s => {
  if (!s.fecha_hora_cita) return false;
  return new Date(s.fecha_hora_cita).getTime() <= now.getTime();
});
const conChecklist = checklistEvaluable.filter(s => s.checklistCompleto).length;
// checklistsRate usa checklistEvaluable.length como denominador
```

### Archivo 3: `src/components/monitoring/performance/PerformanceMetricCards.tsx`

**Cambio**: Actualizar el subtitle del card de Checklists para mostrar cuántos servicios son evaluables vs total, dando transparencia al usuario.

```typescript
subtitle={`${metricas.checklistsRate}% de ${metricas.checklistsEvaluables || metricas.totalServicios} evaluables`}
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/usePerformanceDiario.ts` | Filtrar servicios futuros del cálculo de checklistsRate |
| `src/hooks/usePerformanceHistorico.ts` | Mismo filtro en computeGroupMetrics |
| `src/components/monitoring/performance/PerformanceMetricCards.tsx` | Mostrar cantidad evaluable en subtitle |

## Resultado

- Checklists Rate solo refleja servicios cuya cita ya pasó
- Un servicio de las 8 PM no penaliza el indicador a las 10 AM
- El subtitle muestra "X% de Y evaluables" para transparencia
- Días históricos no se ven afectados (todos sus servicios ya vencieron)

