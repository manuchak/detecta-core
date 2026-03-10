

# Fix: "0 monitoristas en turno" — Heartbeat & OrphanGuard Architecture

## Root Cause Analysis

Three structural problems compound to produce the "0 en turno" false negative:

```text
PROBLEMA: "0 en turno · 32 activos"
              |
  ┌───────────┼───────────────┐──────────────┐
  │           │               │              │
HEARTBEAT   ORPHANGUARD    BALANCEGUARD    ADOPCIÓN
  │           │               │              │
Ping solo    Solo corre      Solo corre     Tabla nueva
en Bitácora  dentro del      dentro del     = vacía
tab          overlay C4      overlay C4     = 0 online
(no en C4)   (no continuo)   (no continuo)
```

1. **Heartbeat solo en Bitácora**: El ping se emite desde `MonitoristaAssignmentBar` (montado solo en la tab Bitácora). Cuando el coordinador ve Coordinación C4, el componente no está montado → no hay pings → tabla vacía → 0 en turno.

2. **OrphanGuard/BalanceGuard acoplados al overlay**: Ambos viven como `useEffect` dentro de `CoordinatorCommandCenter`. Solo corren cuando el coordinador tiene esa tab activa, no de forma continua.

3. **Sin fallback de adopción**: La tabla `monitorista_heartbeat` es nueva. No hay mecanismo de transición: si la tabla está vacía, todos aparecen offline.

## Solución

### Cambio 1: Mover heartbeat a MonitoringPage (nivel página)

Extraer el heartbeat ping de `MonitoristaAssignmentBar` y crear un hook `useHeartbeatPing` que se monte en `MonitoringPage.tsx`. Así el ping se ejecuta independientemente de la tab activa.

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useHeartbeatPing.ts` | **Nuevo**. Hook que obtiene el user ID y hace upsert cada 2 min |
| `src/pages/Monitoring/MonitoringPage.tsx` | Importar y montar `useHeartbeatPing()` al nivel de página |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Eliminar el `useEffect` del heartbeat (ya no es responsabilidad de este componente) |

### Cambio 2: Fallback en detección de presencia

En `useMonitoristaAssignment.ts`, si la tabla heartbeat devuelve 0 resultados (adopción inicial), usar un fallback basado en asignaciones formales activas del turno actual. Esto es temporal hasta que todos los monitoristas generen heartbeats.

```text
en_turno = heartbeat.has(user_id)
         || (heartbeat.size === 0 && hasFormalAssignment)  ← fallback
```

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useMonitoristaAssignment.ts` | Si `onlineUserIds.size === 0`, usar fallback: marcar como `en_turno` a quienes tengan asignaciones formales activas |

### Cambio 3: Extraer OrphanGuard a hook independiente

Mover la lógica de OrphanGuard y BalanceGuard de `CoordinatorCommandCenter.tsx` a un hook `useOrphanGuard.ts` que se monte en `MonitoringPage` (solo para coordinadores). Esto garantiza ejecución continua sin depender de qué tab esté activa.

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useOrphanGuard.ts` | **Nuevo**. Contiene la lógica de auto-asignación (pending ≤2h), reasignación de servicios huérfanos (monitorista offline), y BalanceGuard. Consume `useMonitoristaAssignment` y `useBitacoraBoard` |
| `src/pages/Monitoring/MonitoringPage.tsx` | Si `isCoordinator`, montar `useOrphanGuard()` |
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Eliminar los `useEffect` de OrphanGuard y BalanceGuard (ya viven en el hook) |

### Cambio 4: UI clara para servicios huérfanos

En `CoordinatorCommandCenter`, agregar un banner prominente cuando hay servicios huérfanos (sin asignar + activos), con conteo y botón de acción directa.

| Archivo | Cambio |
|---------|--------|
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | Agregar banner de alerta rojo cuando `unassigned.length > 0` con texto "X servicios sin monitorista" y botón "Asignar ahora" |

## Archivos totales a modificar

1. `src/hooks/useHeartbeatPing.ts` — **nuevo**
2. `src/hooks/useOrphanGuard.ts` — **nuevo**
3. `src/hooks/useMonitoristaAssignment.ts` — fallback de adopción
4. `src/pages/Monitoring/MonitoringPage.tsx` — montar heartbeat + OrphanGuard
5. `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` — remover heartbeat
6. `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` — remover OrphanGuard/BalanceGuard, agregar banner huérfanos

