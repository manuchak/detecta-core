

# Fix: "0 monitoristas en turno" + botón "Asignar ahora" deshabilitado

## Diagnóstico confirmado con datos reales

La tabla `monitorista_heartbeat` solo tiene 1 registro: el del admin (`131bdb62`). Los 4 monitoristas activos (`4a4dc16`, `c5a26dd`, `4e32f25`, `1079b6f`) NO tienen heartbeat porque aún no han recargado su navegador desde que se desplegó el código del heartbeat.

**El fallback está roto.** La lógica actual:
```text
useHeartbeatFallback = onlineUserIds.size === 0 && formallyAssignedUserIds.size > 0
```
`onlineUserIds.size` es 1 (el admin), no 0. Pero el admin NO es monitorista. Resultado: el fallback no se activa y 0 monitoristas aparecen "en turno". El botón "Asignar ahora" queda deshabilitado porque depende de `enTurno.length > 0`.

## Solución: Triple fallback robusto

Cambiar la lógica de presencia en `useMonitoristaAssignment.ts` para que:

1. **Primary**: Heartbeat (si algún monitorista tiene heartbeat reciente)
2. **Fallback 1**: Actividad reciente de eventos (si ningún monitorista tiene heartbeat pero sí eventos en los últimos 10 min)
3. **Fallback 2**: Asignaciones formales activas (si no hay datos de ningún tipo)

### Cambio en `useMonitoristaAssignment.ts`

Reemplazar la lógica de líneas 192-208:
```typescript
// Check how many MONITORISTAS (not just any user) are online via heartbeat
const monitoristasIds = new Set((monitoristasQuery.data || []).map(m => m.id));
const monitoristasOnline = new Set(
  [...onlineUserIds].filter(id => monitoristasIds.has(id))
);

const monitoristas = (monitoristasQuery.data || []).map(m => {
  const activity = activityByMonitorista.get(m.id);
  let enTurno: boolean;

  if (monitoristasOnline.size > 0) {
    // Primary: heartbeat
    enTurno = monitoristasOnline.has(m.id);
  } else if (activityByMonitorista.size > 0) {
    // Fallback 1: recent event activity (any monitorista with events in last 10 min)
    const TEN_MIN = 10 * 60_000;
    enTurno = !!activity?.lastActivity &&
      (Date.now() - new Date(activity.lastActivity).getTime()) < TEN_MIN;
  } else {
    // Fallback 2: formal assignments
    enTurno = formallyAssignedUserIds.has(m.id);
  }

  return { ...m, en_turno: enTurno, last_activity: activity?.lastActivity, event_count: activity?.eventCount || 0 };
});
```

### Cambio en `CoordinatorCommandCenter.tsx`

Hacer que "Asignar ahora" funcione incluso con 0 en_turno, usando monitoristas con actividad reciente como alternativa:

```typescript
// If no en_turno but there are monitoristas with recent activity, use those
const eligibleForAssignment = enTurno.length > 0
  ? enTurno
  : monitoristas.filter(m => (m.event_count || 0) > 0);
```

Y usar `eligibleForAssignment` en lugar de `enTurno` para los botones de asignación.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useMonitoristaAssignment.ts` | Corregir fallback: verificar intersección de heartbeats con IDs de monitoristas, no tamaño total del set. Agregar fallback por actividad de eventos. |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Usar monitoristas con actividad como alternativa cuando `enTurno.length === 0` para habilitar "Asignar ahora". |

