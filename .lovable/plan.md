
## Fix: Corregir JOIN entre checklists y servicios planificados

### Problema raiz

La tabla `checklist_servicio` almacena en `servicio_id` el identificador textual del servicio (ej: `YOCOYTM-273`), pero el hook de monitoreo busca por el UUID de `servicios_planificados.id`. Nunca hay coincidencia, asi que todos los servicios aparecen como "Sin Checklist" aunque los custodios si los completaron.

| Tabla | Campo | Valor ejemplo |
|---|---|---|
| `servicios_planificados` | `id` (UUID) | `4e43d036-035e-4de7-a3ba-...` |
| `servicios_planificados` | `id_servicio` (texto) | `YOCOYTM-273` |
| `checklist_servicio` | `servicio_id` | `YOCOYTM-273` (texto) |

El hook usa `servicios_planificados.id` (UUID) para buscar en `checklist_servicio.servicio_id` (texto) = 0 resultados.

### Solucion

Cambiar el hook `useChecklistMonitoreo.ts` para hacer el match usando `id_servicio` (texto) en vez de `id` (UUID).

### Cambios

**Archivo: `src/hooks/useChecklistMonitoreo.ts`**

1. Linea 183: Cambiar el mapeo de IDs para usar `id_servicio` en vez de `id`:
   ```typescript
   // ANTES
   const servicioIds = servicios?.map((s) => s.id) || [];

   // DESPUES
   const servicioIds = servicios?.map((s) => s.id_servicio).filter(Boolean) || [];
   ```

2. Linea 199: Actualizar el Map para usar `id_servicio` como clave del lookup:
   ```typescript
   // ANTES (key = UUID)
   const checklistMap = new Map(checklists?.map((c) => [c.servicio_id, c]) || []);

   // DESPUES (sin cambio en esta linea, pero el .get() de linea 204 debe usar id_servicio)
   ```

3. Linea 204: Cambiar la busqueda en el map para usar `svc.id_servicio`:
   ```typescript
   // ANTES
   const checklist = checklistMap.get(svc.id);

   // DESPUES
   const checklist = checklistMap.get(svc.id_servicio);
   ```

### Resultado esperado

Los checklists completados por custodios se vincularan correctamente con los servicios planificados. Las tarjetas de resumen (Completos, Pendientes, Sin Checklist) mostraran los numeros reales en lugar de marcar todo como "Sin Checklist".
