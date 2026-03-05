

# Timer reset al finalizar evento especial

## Problema

El timer calcula `minutesSinceLastAction` usando `hora_inicio` del último evento (línea 174 de `useBitacoraBoard.ts`). Cuando un evento especial se finaliza y el servicio regresa a "En Curso", el timer muestra el tiempo desde que el evento **empezó**, no desde que **terminó**. Debería reiniciarse a 0 usando `hora_fin` del evento finalizado.

## Cambio

**Archivo**: `src/hooks/useBitacoraBoard.ts`, líneas 172-175

Cambiar la lógica de `lastEventAt` para considerar `hora_fin` cuando existe. La fecha más reciente entre todos los `hora_inicio` y `hora_fin` de los eventos debe ser la referencia del timer:

```ts
// Current (broken):
const lastEvent = events.length > 0 ? events[0] : null;
const lastEventAt = lastEvent ? new Date(lastEvent.hora_inicio) : ...;

// Fixed:
const lastActionTime = events.reduce<Date | null>((latest, e) => {
  const start = new Date(e.hora_inicio);
  const end = e.hora_fin ? new Date(e.hora_fin) : null;
  const eventLatest = end && end > start ? end : start;
  return !latest || eventLatest > latest ? eventLatest : latest;
}, null);
const lastEventAt = lastActionTime || (svc.hora_inicio_real ? new Date(svc.hora_inicio_real) : null);
```

Esto garantiza que al finalizar un evento especial (que registra `hora_fin = NOW()`), el timer se reinicia a 0 minutos — mismo comportamiento que un checkpoint/touchpoint.

