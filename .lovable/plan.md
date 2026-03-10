

# Evaluación: OrphanGuard asignando servicios con cita a +400 minutos

## Problema

El OrphanGuard tiene 3 reglas de detección:

```text
Rule 1: Pending sin asignación, cita ≤2h        ← CORRECTO (ventana acotada)
Rule 2: Activos sin asignación                   ← CORRECTO (ya iniciados, urgente)
Rule 2b: Pending sin asignación (ANY time)       ← BUG: sin filtro de tiempo
```

**Rule 2b** (línea 114-117) fue diseñada como "safety net" para reparar servicios que perdieron asignación por ping-pong entre guards. Sin embargo, al no tener filtro de hora, captura servicios con cita a 6-7 horas de distancia y los asigna inmediatamente. Esto genera:

1. Carga artificial en monitoristas (servicios que no requieren atención aún)
2. El BalanceGuard luego los redistribuye innecesariamente
3. Los conteos del coordinador se inflan con servicios irrelevantes

## Corrección

### Unificar Rule 2b con Rule 1 usando una ventana más amplia

Eliminar Rule 2b como regla separada. Ampliar Rule 1 para cubrir el caso de "orphan repair" con una ventana razonable — por ejemplo, servicios con cita en las próximas **4 horas** o que ya pasaron su cita hasta **60 minutos** atrás (en lugar de los 30 min actuales para servicios nuevos).

```text
ANTES:
  Rule 1: pendientes sin asignación, cita entre -30min y +2h
  Rule 2b: pendientes sin asignación, SIN FILTRO

DESPUÉS:
  Rule 1 unificada: pendientes sin asignación, cita entre -60min y +4h
  (Rule 2b eliminada)
```

Esto cubre:
- Servicios próximos que necesitan monitorista (ventana de 4h)
- Servicios que ya pasaron su cita y aún no inician (hasta -60 min, después se consideran zombi)
- Evita asignar servicios de la tarde a las 7am

### Cambio en `src/hooks/useOrphanGuard.ts`

- Líneas 100-107: Ampliar ventana de Rule 1 a `FOUR_HOURS` y `-60min`
- Líneas 114-117: Eliminar Rule 2b completamente
- Línea 119: `allEligible` solo combina Rule 1 + Rule 2 (activos sin asignación)

### Archivo afectado
- `src/hooks/useOrphanGuard.ts` — una sola modificación en la sección de reglas del OrphanGuard

