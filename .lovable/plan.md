
# Fix: "Error al asignar armado" - ID Mismatch en assignArmedGuard

## Causa raiz

En `useServiciosPlanificados.ts`, la mutacion `assignArmedGuard` (linea 399) busca el servicio con:
```
.eq('id', serviceId)   // Espera un UUID
```

Pero `PendingAssignmentModal.tsx` (linea 464) le pasa:
```
serviceId: service.id_servicio   // Envia codigo humano como "LUCOLLM-92"
```

El query `WHERE id = 'LUCOLLM-92'` no encuentra nada (porque `id` es un UUID), y lanza "Servicio no encontrado", que se muestra como "Error al asignar armado".

Este mismo error se introdujo cuando estandarizamos `servicio_custodia_id` a `id_servicio` en el commit anterior: se cambio el caller a pasar `id_servicio` pero la mutacion sigue esperando UUID en su `WHERE` clause.

## Impacto

- Afecta **toda asignacion de armados** desde el PendingAssignmentModal (flujo principal de planeacion)
- El flujo de reasignacion (`reassignArmedGuard`) NO esta afectado porque tiene validacion UUID explicita (linea 680)
- El flujo de `ScheduledServicesTab` usa `updateServiceConfiguration` (diferente ruta), tampoco afectado

## Correccion

### Archivo: `src/hooks/useServiciosPlanificados.ts`

**Cambio 1**: En `assignArmedGuard` (linea 396-400), cambiar la query para que soporte ambos formatos de ID. Si el `serviceId` tiene formato UUID, buscar por `id`; si no, buscar por `id_servicio`. Esto mantiene compatibilidad con cualquier caller.

```typescript
// Detectar si es UUID o id_servicio
const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(serviceId);
const query = supabase
  .from('servicios_planificados')
  .select('...')
if (isUuid) {
  query.eq('id', serviceId);
} else {
  query.eq('id_servicio', serviceId);
}
```

**Cambio 2**: En la actualizacion de `servicios_planificados` (linea 446), usar la misma logica para el `WHERE` del `UPDATE`.

### Archivo: `src/components/planeacion/PendingAssignmentModal.tsx`

**Cambio 3**: Corregir el caller para pasar el UUID (`service.id`) en lugar de `service.id_servicio`, ya que el UUID es mas robusto para queries por primary key. Mantener un fallback.

```typescript
await assignArmedGuard({
  serviceId: service.id,  // UUID, primary key
  armadoName: armedData.armado_nombre,
  armadoId: armedData.armado_id
});
```

### Archivos a modificar

1. `src/hooks/useServiciosPlanificados.ts` - Hacer query flexible por UUID o id_servicio
2. `src/components/planeacion/PendingAssignmentModal.tsx` - Pasar UUID en lugar de id_servicio

### Riesgo

Nulo - solo corrige la discrepancia entre el caller y la query. La insercion en `asignacion_armados` sigue usando `id_servicio` (via `currentService.id_servicio`), que es correcto.
