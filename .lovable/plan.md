

# Problema: Marzo muestra 34 porque normaliza contra el mes completo

## Diagnóstico

`getPeriodRangeOffset('MoM', 0)` genera el rango **1 Mar → 1 Abr** (31 días completos). Pero hoy es 3 de marzo — solo hay 3 días de datos reales. El cálculo normaliza los incidentes de esos 3 días contra los servicios estimados de **31 días**, diluyendo el score. Lo mismo pasa con DoD, WoW, QoQ: el rango del periodo actual (offset=0) siempre llega hasta el inicio del **siguiente** periodo, no hasta `now`.

Líneas 82-85:
```typescript
case 'MoM': {
  const base = subMonths(startOfMonth(now), offset);   // Mar 1
  const end = subMonths(startOfMonth(now), offset - 1); // Apr 1 ← futuro!
}
```

`periodDays` = 31, pero solo 3 días han transcurrido. El `estimatedPeriodServices` se infla x10, el `incidentRate` se diluye, y el score cae al piso de exposición (~34).

## Solución

Para **offset === 0** (periodo actual/en curso), limitar `to` a **`now`** en vez del inicio del siguiente periodo. Así:

- MoM offset=0: Mar 1 → Mar 3 (hoy) → `periodDays` = 3, no 31
- WoW offset=0: Lun → hoy → días reales transcurridos
- DoD offset=0: hoy 00:00 → ahora → horas reales

Esto hace que los incidentes de los 3 días de marzo se normalicen contra los servicios de esos 3 días, no de 31.

### Cambio en `useDetectaRiskFactor.ts`

En `getPeriodRangeOffset`: cuando `offset === 0`, usar `new Date().toISOString()` como `to` en lugar de `startOfNextPeriod`.

| Archivo | Cambio |
|---------|--------|
| `useDetectaRiskFactor.ts` | Limitar `to` del periodo actual a `now` para no diluir scores con días futuros |

