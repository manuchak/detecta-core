
# Fix: Cambio de armado duplica el servicio

## Problema raiz

En `src/hooks/useServiciosPlanificados.ts`, la mutacion `reassignArmedGuard` (linea 708) solo hace un `INSERT` de un nuevo registro en `asignacion_armados`, pero **nunca cancela ni actualiza el registro anterior**. El resultado es que el servicio queda con 2 asignaciones activas de armado, lo cual causa que las vistas del dashboard lo muestren duplicado (una vez por cada asignacion).

## Solucion

### Archivo: `src/hooks/useServiciosPlanificados.ts`

Antes del `INSERT` en linea 708, agregar una operacion que cancele las asignaciones activas previas para ese servicio:

1. **Cancelar asignaciones previas**: Ejecutar un `UPDATE` en `asignacion_armados` para poner `estado_asignacion = 'cancelado'` en todos los registros activos del mismo `servicio_custodia_id` (antes de insertar el nuevo).

2. **Solo para reasignacion (no para agregar)**: Este comportamiento aplica cuando es una reasignacion (cambiar un armado por otro). Si el servicio requiere multiples armados (`cantidad_armados_requeridos > 1`), solo se debe cancelar la asignacion especifica que se esta reemplazando, no todas.

### Cambio concreto

Antes de la linea 708 (`await supabase.from('asignacion_armados').insert({...})`), insertar:

```typescript
// Cancel previous active assignments for this service (reassignment = replace, not add)
const { error: cancelError } = await supabase
  .from('asignacion_armados')
  .update({ 
    estado_asignacion: 'cancelado',
    observaciones: `Reemplazado por: ${newArmadoName}. Motivo: ${reason}`
  })
  .eq('servicio_custodia_id', currentService.id_servicio)
  .not('estado_asignacion', 'eq', 'cancelado');

if (cancelError) {
  console.error('Error cancelling previous assignments:', cancelError);
  // Non-blocking: continue with the new assignment
}
```

Esto garantiza que al reasignar un armado, el anterior se marca como cancelado y no genera duplicados en el dashboard.

### Sin cambios de base de datos
Solo es un fix de logica en el frontend.
