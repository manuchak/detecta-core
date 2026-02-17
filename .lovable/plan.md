
## Corregir filtrado de custodios rechazados e inactivos en todo el workflow

### Problema 1: Custodios rechazados siguen apareciendo

Hay 17 rechazos vigentes en `custodio_rechazos`, pero el hook `useRechazosVigentes()` (definido en `useCustodioRechazos.ts`) **nunca se consume** en ningun componente. Los rechazos se registran correctamente pero no se filtran al mostrar las listas.

**Causa raiz**: El filtrado de rechazos no esta integrado en `useProximidadOperacional`, que es el punto central de datos para todos los modales de asignacion (CustodianStep, PendingAssignmentModal, ReassignmentModal).

**Solucion**: Integrar `useRechazosVigentes` directamente dentro de `useProximidadOperacional` para que **todos los consumidores** reciban la lista ya filtrada, sin necesidad de cambiar cada modal individualmente.

### Problema 2: Christian Canseco sigue activo en la base de datos

La consulta confirma que `CHRISTIAN CANSECO CASTILLO` tiene `estado: 'activo'` en `custodios_operativos`. El cambio de estatus aparentemente no se persisitio. Esto es un dato operativo que debe corregirse manualmente (o investigar por que fallo el UPDATE), pero a nivel de codigo se puede mejorar la retroalimentacion.

**Solucion de codigo**: Agregar validacion post-UPDATE en `useCambioEstatusOperativo` que verifique que el cambio se persistio leyendo el registro despues del update, y mostrar error explicito si no coincide.

---

### Archivos a modificar

**1. `src/hooks/useProximidadOperacional.ts`**

En la funcion `queryFn` de `useCustodiosConProximidad`, justo antes de la categorizacion final (linea ~400), obtener los IDs rechazados y filtrarlos:

```text
// Antes de categorizar:
const { data: rechazos } = await supabase
  .from('custodio_rechazos')
  .select('custodio_id')
  .gt('vigencia_hasta', new Date().toISOString());

const rechazadosIds = new Set((rechazos || []).map(r => r.custodio_id));
const custodiosSinRechazos = custodiosProcessed.filter(c => !rechazadosIds.has(c.id));

// Log para visibilidad operativa
if (rechazadosIds.size > 0) {
  console.log(`🚫 ${rechazadosIds.size} custodios excluidos por rechazos vigentes`);
}

// Luego categorizar usando custodiosSinRechazos en lugar de custodiosProcessed
```

Esto resuelve el filtrado para TODOS los modales simultaneamente:
- CustodianStep (creacion de servicio)
- PendingAssignmentModal (asignacion pendiente)
- ReassignmentModal (reasignacion)
- Cualquier futuro consumidor del hook

**2. `src/hooks/useCambioEstatusOperativo.ts`**

Despues del `UPDATE` exitoso (linea ~75), agregar una lectura de verificacion:

```text
// Verificar que el cambio se persistio
const { data: verificacion } = await supabase
  .from(tableName)
  .select('estado')
  .eq('id', operativoId)
  .single();

if (verificacion?.estado !== estatusNuevo) {
  console.error('El cambio de estatus no se persistio:', {
    esperado: estatusNuevo,
    actual: verificacion?.estado
  });
  toast.error('El cambio no se guardo correctamente', {
    description: 'Posible restriccion de permisos. Contacte al administrador.'
  });
  return false;
}
```

---

### Resultado esperado

| Problema | Antes | Despues |
|----------|-------|---------|
| Rechazos en PendingAssignmentModal | Custodios rechazados aparecen | Filtrados automaticamente |
| Rechazos en ReassignmentModal | Custodios rechazados aparecen | Filtrados automaticamente |
| Rechazos en CustodianStep | Rechazos no se filtran a nivel de hook | Filtrados en el hook central |
| Cambio de estatus silencioso | UPDATE falla sin feedback | Verificacion post-UPDATE con toast de error |

### Riesgo

Bajo. El filtrado de rechazos agrega una query ligera (1 SELECT a `custodio_rechazos`) dentro de un flujo que ya hace multiples RPCs. La verificacion post-UPDATE es una lectura adicional minima.
