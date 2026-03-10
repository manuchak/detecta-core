

# Fix: Race condition OrphanGuard vs BalanceGuard deja servicios huérfanos

## Problema
OrphanGuard asigna un servicio, BalanceGuard lo rebalancea inmediatamente (desactivando la asignación previa), y en el siguiente ciclo OrphanGuard lo vuelve a detectar como huérfano. El servicio nunca mantiene una asignación activa.

## Solución: Doble protección

### 1. `src/hooks/useOrphanGuard.ts`

**A) Cooldown compartido entre guards**: Agregar un `lastMutationRef` timestamp compartido. Ningún guard ejecuta si el otro mutó hace <15 segundos.

**B) BalanceGuard excluye servicios recién asignados**: Filtrar del rebalanceo cualquier servicio que fue auto-asignado en los últimos 60 segundos (nuevo `recentAutoAssignedRef` con timestamps en vez de solo IDs).

**C) OrphanGuard persiste mejor el dedup**: Cambiar `autoAssignedRef` para que no se limpie en `onError` solamente, sino que mantenga los IDs por al menos 2 minutos antes de permitir re-asignación.

### 2. Fix inmediato para GRIAGEM-2
Ejecutar una query para re-crear la asignación activa del servicio huérfano actual.

## Cambios concretos

### `useOrphanGuard.ts`
- Agregar `lastMutationTimestampRef = useRef(0)` compartido
- En OrphanGuard: antes de `autoDistribute.mutate`, verificar `Date.now() - lastMutationTimestampRef.current > 15_000`; en `onSuccess`, actualizar `lastMutationTimestampRef.current = Date.now()`
- En BalanceGuard: misma verificación de cooldown antes de `rebalanceLoad.mutate`; en `onSuccess`, actualizar timestamp
- Cambiar `autoAssignedRef` de `Set<string>` a `Map<string, number>` (ID → timestamp). Solo permitir re-asignación si el timestamp tiene >120s de antigüedad
- En `executeSafeRebalance`, excluir del pool de servicios movibles aquellos en `autoAssignedRef` con timestamp <60s

### Migration SQL (fix data)
Insertar una asignación activa para GRIAGEM-2 asignándolo al monitorista con menor carga actual.

## Resultado
Los dos guards ya no pueden pisarse mutuamente. Un servicio recién asignado tiene un periodo de gracia de 60-120s antes de ser elegible para rebalanceo.

