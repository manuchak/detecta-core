

# Sincronización instantánea: Badge de estado + botón Arribado

## Problema
Al marcar "En sitio", el `StatusUpdateButton` cambia optimísticamente a "Arribado HH:mm", pero el badge de estado operativo (ej. "Pendiente arribar") sigue mostrando el estado anterior hasta que el refetch completa. Son dos elementos independientes que no comparten estado optimista.

## Solución: Callback con estado optimista desde StatusUpdateButton

En lugar de levantar estado al padre (refactor grande), hacer que `StatusUpdateButton` notifique al padre del cambio optimista vía un **nuevo callback `onOptimisticChange`**. El padre mantiene un `Map<serviceId, arrival_time>` de overrides optimistas que se aplican al computar `operationalStatus`.

### Cambios

**`StatusUpdateButton.tsx`**
- Agregar prop `onOptimisticChange?: (serviceId: string, arrival: string | null) => void`
- Llamar `onOptimisticChange(serviceId, arrivalTime)` al inicio de `handleMarkOnSite`
- Llamar `onOptimisticChange(serviceId, null)` en el `catch` (rollback) y en `handleRevert`

**`ScheduledServicesTabSimple.tsx`**
- Agregar estado: `const [optimisticArrivals, setOptimisticArrivals] = useState<Map<string, string>>(new Map())`
- Handler: `handleOptimisticChange(serviceId, arrival)` — setea o borra del Map
- Antes de computar `operationalStatus`, verificar si `optimisticArrivals.has(service.id)` — si sí, override el status a `en_sitio` y usar la hora del Map para el badge "Arribado"
- Pasar `onOptimisticChange` al `StatusUpdateButton`

**`CompactServiceCard.tsx`**
- Misma lógica: recibir `optimisticArrivals` o `optimisticArrival` como prop
- Aplicar override en el badge de estado antes de renderizar

Resultado: al hacer clic en "En sitio", **ambos** el badge de estado y el botón cambian instantáneamente a emerald "Arribado HH:mm".

