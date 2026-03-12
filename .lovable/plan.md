

# Auditoría: Por qué los monitoristas solo ven 16 de 27 servicios

## Hallazgo

**Datos en vivo:**
- **27** servicios activos hoy (con `hora_llegada_custodio`, no cancelados/completados)
- **22** tienen asignación activa de monitorista (11 Karla, 11 Iñaki)
- **15** servicios SIN asignación — todos visibles en el board pero ignorados por OrphanGuard

Cada monitorista ve solo sus 11 asignados. El coordinador ve los 27 en el board pero 15 no están asignados a nadie.

## Causa Raíz: Ventana temporal de OrphanGuard demasiado restrictiva

```text
OrphanGuard Rule 1 (línea 109):
  timeUntil > SIXTY_MIN_AGO  →  cita debe ser de hace < 1 hora

Servicios no asignados hoy:
  TEOVTEL-805    cita hace 18h
  ASCAAST-1559   cita hace 16h  
  PRIAPPE-212    cita hace  9h
  ASCAAST-1560   cita hace  6h
  ... (11 más, todos hace 4-6h)
```

**El board muestra todos los servicios del día** (ventana de 24h). Pero OrphanGuard solo auto-asigna servicios con cita entre **-60min y +4h**. Los 15 servicios tienen citas de hace 4-18 horas → OrphanGuard los ignora permanentemente.

Esto pasa porque los custodios llegan tarde, o las citas son temprano pero el arribo se registra horas después. Son servicios legítimos y visibles en Bitácora, pero nunca se les asigna monitorista.

## Solución: Alinear OrphanGuard con la visibilidad del Board

**Archivo: `src/hooks/useOrphanGuard.ts`**

Cambiar Rule 1: en lugar de filtrar `pendingServiceIds` por ventana de cita, usar **todos** los `pendingServiceIds` directamente. Estos ya pasaron los filtros del board (hora_llegada_custodio seteado, hoy, estado correcto) — si están en el board, deben ser elegibles para asignación.

La lógica cambia de:
```typescript
// ANTES: ventana -60min a +4h
const eligiblePending = pendingServiceIds.filter(id => {
  ...
  const timeUntil = new Date(citaStr).getTime() - now;
  return timeUntil <= FOUR_HOURS && timeUntil > SIXTY_MIN_AGO;
});
```

A:
```typescript
// DESPUÉS: todo lo visible en el board es elegible
const eligiblePending = pendingServiceIds.filter(id => {
  if (effectiveAssigned.has(id) || isRecentlyAutoAssigned(id) || isServiceLocked(id)) return false;
  return true;
});
```

También ajustar **Rule 4 (cleanup)** y **BalanceGuard** para usar la misma lógica ampliada en `operationalBoardIds`, eliminando el filtro de ventana temporal para pendientes.

**Impacto:** Los 15 servicios huérfanos serán auto-asignados en el siguiente ciclo de OrphanGuard (~15s), distribuyéndose equitativamente entre los 2 monitoristas en turno.

