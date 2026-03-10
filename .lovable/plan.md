

# Fix: Guards ignoran pausas activas y reasignan servicios de vuelta

## Problema

Cuando Karla activa su pausa de desayuno:
1. `useMonitoristaPause` correctamente desactiva sus asignaciones y las redistribuye
2. Pero Karla sigue con heartbeat activo → `en_turno = true`
3. **BalanceGuard** detecta que Karla tiene 0 servicios y los demás tienen más → rebalancea servicios DE VUELTA a ella
4. **OrphanGuard** incluye a Karla en `enTurno.map(m => m.id)` cuando auto-distribuye

Resultado: los servicios le caen de nuevo como se ve en la screenshot (9 servicios asignados estando en pausa).

## Causa raíz

`useOrphanGuard.ts` no consulta `bitacora_pausas_monitorista` para excluir monitoristas en pausa activa. Ambos guards (OrphanGuard y BalanceGuard) tratan a Karla como disponible.

## Fix

**Archivo:** `src/hooks/useOrphanGuard.ts`

1. Al inicio del effect principal, consultar `bitacora_pausas_monitorista` con `estado = 'activa'` para obtener los IDs de monitoristas en pausa
2. Filtrar `enTurno` para excluir monitoristas en pausa antes de pasarlos a:
   - `autoDistribute.mutate()` (línea ~109) — para que OrphanGuard no les asigne
   - `executeSafeRebalance()` — para que BalanceGuard no mueva servicios hacia ellos ni cuente su carga como desbalanceada

```text
// Inside useOrphanGuard, before guards run:
const pausedIdsQuery = useQuery({
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

// Then filter:
const enTurnoDisponible = enTurno.filter(m => !pausedIds.has(m.id));
```

3. Usar `enTurnoDisponible` en lugar de `enTurno` en:
   - OrphanGuard Rule 1/2/2b: `autoDistribute.mutate({ ..., monitoristaIds: enTurnoDisponible.map(m => m.id) })`
   - OrphanGuard Rule 3: destino de reasignación de offline
   - BalanceGuard `executeSafeRebalance`: iterar solo sobre `enTurnoDisponible`

### Alcance
- 1 archivo modificado: `src/hooks/useOrphanGuard.ts`
- ~10 líneas añadidas (query de pausas + filtro), ~5 líneas modificadas (reemplazar `enTurno` por `enTurnoDisponible`)

