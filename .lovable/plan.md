

# Fishbone: Desincronización Coordinador ↔ Monitorista

## Causa Raíz

```text
Coordinador ve 10          Monitorista ve 8
         │                        │
    combinedAssignments      assignedIdsQuery
    (formal + inferred)      (solo formal activo)
         │                        │
    ┌────┴────┐                   │
    │ 8 formal│ ← coinciden →     8
    │ 2 infer.│ ← SIN MATCH →    0
    └─────────┘
```

El hook `useMonitoristaAssignment` fabrica "inferred assignments" a partir de `servicio_eventos_ruta.registrado_por`. Estos aparecen en la vista del coordinador pero **nunca** se escriben en `bitacora_asignaciones_monitorista`, así que el monitorista no los ve. El servicio FAEAFCA-277 es uno de estos fantasmas.

## Solución

Eliminar completamente el concepto de **inferred assignments**. Ambas vistas usarán exclusivamente `bitacora_asignaciones_monitorista` con `activo = true` como fuente única de verdad.

## Cambios

### 1. `src/hooks/useMonitoristaAssignment.ts`
- Eliminar `recentActivityQuery` (líneas 147-170) y todo el cómputo de `activityByMonitorista` (173-189)
- Eliminar la construcción de `inferredServiceMonitorista` e `inferredAssignments` (227-255)
- Reemplazar `combinedAssignments` por solo `allAssignments.data` (línea 257)
- Eliminar el campo `inferred` del tipo `MonitoristaAssignment`
- Simplificar `en_turno` a solo heartbeat + fallback a asignaciones formales (sin capa de actividad)
- El `event_count` y `last_activity` en `MonitoristaProfile` se pueden derivar opcionalmente o eliminar

### 2. `src/components/monitoring/coordinator/MonitoristaCard.tsx`
- Eliminar el badge "auto" que muestra `a.inferred`

### 3. `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx`
- Eliminar filtros `!a.inferred` (ya no necesarios, todos son formales)
- Eliminar el badge `totalInferred`

### 4. `src/components/monitoring/coordinator/AbandonedServicesSection.tsx`
- Eliminar filtro `!a.inferred`

### 5. `src/hooks/useOrphanGuard.ts`
- Eliminar filtros `!a.inferred` en las reglas de reasignación

### 6. `src/hooks/useShiftHandoff.ts`
- Eliminar campo `inferred` y la lógica condicional que lo usa

## Resultado
Coordinador y monitorista ven exactamente los mismos servicios. Si un servicio necesita asignarse, el coordinador (o auto-distribute/OrphanGuard) lo hace explícitamente creando un registro formal.

