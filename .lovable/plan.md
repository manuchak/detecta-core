

# Equidad real: carga activa vs carga total

## Problema

La equidad actual es **numérica pero no operativa**. Karla y Cintia tienen 9 servicios cada una, pero:

- **Cintia**: 8 servicios en curso (monitoreo activo real)
- **Karla**: 2 en curso + 6 "Por Iniciar" (varios a +394m y +454m — servicios que no requieren atención)

El sistema ve "9 = 9" y los considera balanceados. En realidad, Cintia tiene 4x la carga operativa real.

## Causa raíz

Tres defectos en la lógica de balanceo:

1. **`autoDistribute` (línea 319)**: Calcula la carga como `assignmentsByMonitorista[mId].length` — cuenta TODAS las asignaciones activas sin importar si el servicio está en curso o pendiente a 7 horas.

2. **`BalanceGuard` (línea 223)**: Evalúa desbalance con `max - min < 2` sobre conteos totales. Si Karla=9 y Cintia=9, nunca rebalancea aunque la carga real sea 2 vs 8.

3. **Asignaciones legacy**: Servicios a +394m y +454m fueron asignados antes del fix del OrphanGuard. No hay mecanismo para desasignar servicios que salieron de la ventana relevante.

## Plan de corrección

### A. Calcular carga ponderada (no conteo plano)

Modificar `autoDistribute` para que el `initialLoad` solo cuente asignaciones cuyo servicio está **activamente en el board** (en curso, evento especial, o pendiente dentro de la ventana de 4h). Los servicios pendientes fuera de ventana no cuentan como carga.

```text
ANTES:  load[mId] = assignments.length  (todos)
DESPUÉS: load[mId] = assignments.filter(a => activeBoardServiceIds.has(a.servicio_id)).length
```

### B. BalanceGuard: evaluar sobre carga relevante

Ajustar el cálculo de `loadByM` en `executeSafeRebalance` para solo contar servicios dentro de la ventana operativa (en curso + evento + pendiente ≤4h). Así detectará que Cintia=8 vs Karla=2 es un desbalance real.

### C. Cleanup Guard: desasignar servicios fuera de ventana

Agregar una regla al efecto del OrphanGuard que desactive asignaciones para servicios pendientes con cita >4h en el futuro. Estos se reasignarán automáticamente cuando entren en la ventana de 4h.

```text
Rule 4 (nuevo): Si un servicio pendiente tiene asignación activa pero cita > +4h → desactivar asignación
```

Esto evita que servicios lejanos inflen el conteo de ningún monitorista.

### Archivos afectados

- `src/hooks/useMonitoristaAssignment.ts` — `autoDistribute` y `resetAndRedistribute`: filtrar load por servicios relevantes
- `src/hooks/useOrphanGuard.ts` — `executeSafeRebalance`: load ponderado + nueva Rule 4 de cleanup

