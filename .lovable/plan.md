
# Plan: Corregir Pérdida de Referencia Cliente en Flujo de Edición

## Problema Identificado

Daniela reporta que las referencias de servicio (`id_interno_cliente`) se están borrando. El análisis reveló una **cadena de bugs** en la propagación de datos:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUJO DE DATOS ROTO                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Base de datos tiene: " REF: SGDLAI2600014 | "     ✅ Dato existe         │
│                                                                              │
│ 2. RPC get_real_planned_services_summary devuelve    ✅ RPC correcto        │
│    id_interno_cliente correctamente                                          │
│                                                                              │
│ 3. Usuario hace clic en servicio pendiente           ❌ BUG #1              │
│    → servicioToPending() NO incluye id_interno_cliente                       │
│                                                                              │
│ 4. PendingAssignmentModal recibe service             ❌ BUG #2              │
│    sin id_interno_cliente                                                    │
│                                                                              │
│ 5. editableService toma (service as any).id_interno_cliente = undefined     │
│                                                                              │
│ 6. Usuario ve campo vacío en formulario              ❌ Visualización       │
│                                                                              │
│ 7. Si guarda, handleEditServiceSave envía            ❌ BUG #3              │
│    id_interno_cliente: undefined → BORRA EL VALOR                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Evidencia del Bug

| Servicio | En Base de Datos | En UI |
|----------|------------------|-------|
| `fd2b0f69-dd25-4f5a-8aa8-edfd1d9450af` | `" REF: SGDLAI2600014 \| "` | Vacío |

---

## Causa Raíz

### Bug #1: Interface `PendingService` incompleta

```typescript
// src/hooks/usePendingServices.ts - Líneas 6-21
export interface PendingService {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  // ... otros campos
  // ❌ FALTA: id_interno_cliente
}
```

### Bug #2: Transformación pierde el campo

```typescript
// src/hooks/useServiceTransformations.ts - servicioToPending()
const servicioToPending = (servicio: Servicio): PendingService => {
  return {
    id: servicio.id,
    id_servicio: servicio.folio,
    // ... otros campos
    // ❌ FALTA: id_interno_cliente
  };
};
```

### Bug #3: Mapeo en usePendingServices.ts pierde el campo

```typescript
// src/hooks/usePendingServices.ts - Líneas 53-64
const pendingServices: PendingService[] = (data || []).map(service => ({
  id: service.id,
  id_servicio: service.id_servicio,
  // ... otros campos
  // ❌ FALTA: id_interno_cliente: service.id_interno_cliente
}));
```

### Bug #4: Guardado con campo undefined borra el valor

```typescript
// src/components/planeacion/PendingAssignmentModal.tsx - Líneas 517-519
.update({
  id_servicio: data.id_servicio,
  id_interno_cliente: data.id_interno_cliente, // ← undefined → NULL → BORRADO
  ...
})
```

---

## Solución Propuesta

### Cambio 1: Agregar `id_interno_cliente` a Interface `PendingService`

```typescript
// src/hooks/usePendingServices.ts
export interface PendingService {
  id: string;
  id_servicio: string;
  id_interno_cliente?: string; // ← AGREGAR
  nombre_cliente: string;
  // ...resto igual
}
```

### Cambio 2: Agregar mapeo en `usePendingServices.ts`

```typescript
const pendingServices: PendingService[] = (data || []).map(service => ({
  id: service.id,
  id_servicio: service.id_servicio,
  id_interno_cliente: service.id_interno_cliente, // ← AGREGAR
  nombre_cliente: service.nombre_cliente,
  // ...resto igual
}));
```

### Cambio 3: Agregar campo en `servicioToPending()`

```typescript
// src/hooks/useServiceTransformations.ts
const servicioToPending = (servicio: Servicio): PendingService => {
  return {
    id: servicio.id,
    id_servicio: servicio.folio,
    id_interno_cliente: (servicio as any).id_interno_cliente, // ← AGREGAR
    nombre_cliente: ...,
    // ...resto igual
  };
};
```

### Cambio 4: Proteger guardado para no sobrescribir con undefined

```typescript
// src/components/planeacion/PendingAssignmentModal.tsx - handleEditServiceSave
const updatePayload: Record<string, any> = {};

// Solo incluir campos que tienen valor definido
if (data.id_servicio !== undefined) updatePayload.id_servicio = data.id_servicio;
if (data.id_interno_cliente !== undefined) updatePayload.id_interno_cliente = data.id_interno_cliente;
if (data.nombre_cliente !== undefined) updatePayload.nombre_cliente = data.nombre_cliente;
// ...etc

const { error } = await supabase
  .from('servicios_planificados')
  .update(updatePayload)
  .eq('id', id);
```

### Cambio 5: Pasar `id_interno_cliente` al crear pendingService en ScheduledServicesTabSimple

```typescript
// src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx - Línea 364-379
const pendingService = servicioToPending({
  id: service.id,
  folio: service.id_servicio || service.id,
  id_interno_cliente: service.id_interno_cliente, // ← AGREGAR
  cliente: service.cliente_nombre || service.nombre_cliente || '',
  // ...resto igual
} as any);
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/usePendingServices.ts` | Agregar `id_interno_cliente` a interface y mapeo |
| `src/hooks/useServiceTransformations.ts` | Agregar `id_interno_cliente` a `servicioToPending()` |
| `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx` | Pasar `id_interno_cliente` al transformar |
| `src/components/planeacion/PendingAssignmentModal.tsx` | Proteger guardado para no sobrescribir con undefined |

---

## Diagrama del Flujo Corregido

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ FLUJO DE DATOS CORREGIDO                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. Base de datos: id_interno_cliente = "SGDLAI2600014"                       │
│                                                                              │
│ 2. RPC devuelve id_interno_cliente                   ✅                      │
│                                                                              │
│ 3. ScheduledServicesTabSimple pasa                   ✅ FIX #5              │
│    id_interno_cliente a servicioToPending()                                  │
│                                                                              │
│ 4. servicioToPending() incluye el campo              ✅ FIX #3              │
│                                                                              │
│ 5. PendingService tiene el campo                     ✅ FIX #1, #2          │
│                                                                              │
│ 6. Usuario ve "SGDLAI2600014" en formulario          ✅                      │
│                                                                              │
│ 7. Si guarda sin modificar, campo no se envía        ✅ FIX #4              │
│    (no hay sobrescritura accidental)                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Verificación Post-Implementación

1. Crear servicio con Referencia Cliente "TEST-REF-001"
2. Sin asignar custodio (estado: pendiente_asignacion)
3. Abrir modal de edición → Verificar que muestra "TEST-REF-001"
4. Guardar sin modificar → Verificar que el valor NO se borra
5. Revisar en facturación que el campo sigue visible
