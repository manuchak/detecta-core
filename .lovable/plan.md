

# Por qué Cintia recibe servicios estando en pausa

## Problema encontrado

Hay **dos fallas** en la gestión de pausas:

### Falla 1: CoordinatorCommandCenter no filtra pausados
En `CoordinatorCommandCenter.tsx` línea 152:
```typescript
const eligibleForAssignment = enTurno.length > 0
    ? enTurno  // ← NO excluye pausados
    : monitoristas.filter(m => (m.event_count || 0) > 0);
```
Los botones manuales "Auto-distribuir", "Rebalancear" y "Reset" incluyen a Cintia aunque esté en pausa. Si el coordinador usa cualquiera de estos, Cintia recibe servicios.

### Falla 2: OrphanGuard Rule 3 ignora pausados
En `useOrphanGuard.ts` línea 38:
```typescript
const sinTurno = monitoristas.filter(m => !m.en_turno);
```
Un monitorista en pausa tiene `en_turno = true` (tiene heartbeat activo), así que **no entra en `sinTurno`**. Rule 3 solo reasigna servicios de monitoristas en `sinTurno`. Resultado: los servicios de Cintia quedan asignados a ella durante toda la pausa, sin ser redistribuidos.

Mientras tanto, OrphanGuard y BalanceGuard sí la excluyen de `enTurno` (línea 37), así que no le asignan servicios **nuevos** via automático. Pero sus servicios existentes tampoco se mueven. Y si el coordinador usa un botón manual, la incluye de vuelta.

## Solución

### Cambio 1: `CoordinatorCommandCenter.tsx`
Filtrar `eligibleForAssignment` excluyendo monitoristas con pausa activa. Reutilizar la misma query de `pausedIds` que ya usa OrphanGuard, o hacer una query local equivalente.

```typescript
const { data: pausedIds } = useQuery({
  queryKey: ['paused-monitorista-ids'],
  queryFn: async () => {
    const { data } = await supabase
      .from('bitacora_pausas_monitorista')
      .select('monitorista_id')
      .eq('estado', 'activa');
    return new Set((data || []).map(p => p.monitorista_id));
  },
  refetchInterval: 15_000,
});

const eligibleForAssignment = enTurno
  .filter(m => !pausedIds?.has(m.id));
```

### Cambio 2: `useOrphanGuard.ts`
Incluir monitoristas pausados en la lógica de Rule 3 para redistribuir sus servicios durante la pausa:

```typescript
// Paused monitoristas should also have their services redistributed
const pausedWithServices = allEnTurno
  .filter(m => pausedIds?.has(m.id))
  .filter(m => {
    const assignments = (assignmentsByMonitorista[m.id] || []).filter(a => a.activo);
    return assignments.length > 0;
  });

const offlineOrPaused = [...offlineWithServices, ...pausedWithServices];
```

Esto reasigna servicios de Cintia a los monitoristas activos (no pausados) mientras dure su pausa. Cuando regrese de la pausa, el flujo existente de `retorno_pausa` le reasignará servicios con el periodo de gracia de 10 minutos.

### Cambio 3: Badge visual en MonitoristaCard
Agregar indicador "En pausa" en la tarjeta del coordinador para que sea evidente quién está pausado, pasando `pausedIds` a las tarjetas.

