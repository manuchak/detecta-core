

# Fix: Prevenir múltiples eventos `inicio_servicio`

## Problema

Hay **dos caminos** para crear un evento `inicio_servicio`:

1. **`useBitacoraBoard.iniciarServicio`** (línea 241): Tiene guard — verifica `hora_inicio_real` antes de insertar. Si ya existe, lanza error.
2. **`useEventosRuta.startEvent`** (línea 79): **Sin guard** — inserta cualquier tipo de evento sin verificar duplicados. El `EventTracker` permite seleccionar `inicio_servicio` manualmente y registrarlo las veces que quiera.

Resultado: el monitorista puede crear N eventos de inicio sin restricción desde el EventTracker.

## Solución

### Cambio 1: Guard en `useEventosRuta.startEvent`

Antes de insertar un evento de tipo `inicio_servicio`, `llegada_destino` o `liberacion_custodio` (eventos que solo deben ocurrir una vez), consultar si ya existe uno para ese `servicio_id`. Si existe, lanzar error descriptivo.

### Cambio 2: Ocultar `inicio_servicio` del selector manual en EventTracker

Los eventos de transición de estado (`inicio_servicio`, `fin_servicio`, `llegada_destino`, `liberacion_custodio`) se registran automáticamente por las transiciones del Board. No deberían aparecer en el selector manual del EventTracker.

Filtrar `EVENT_TYPES` para excluir estos 4 tipos del selector.

### Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useEventosRuta.ts` | Guard en `startEvent` para tipos únicos |
| `src/components/monitoring/bitacora/EventTracker.tsx` | Filtrar tipos de transición del selector |

