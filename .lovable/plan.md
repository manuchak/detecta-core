

# Plan: Handoff Seamless — Fase A+B

## Problemas identificados en el código actual

1. **Deactivate by `assignment_id`** (linea 222, 234 de `useShiftHandoff.ts`): Si OrphanGuard movió el servicio a otro monitorista entre que se cargó el contexto y se ejecuta el handoff, el `assignment_id` ya no existe activo — el update no hace nada y se crea un duplicado.

2. **Sin freeze de guards**: OrphanGuard/BalanceGuard siguen corriendo cada 15s durante el handoff, pudiendo reasignar servicios que están siendo transferidos.

3. **Revert usa campos incorrectos**: `useRevertHandoff.ts` busca `t.servicioId` y `t.fromMonitorista` pero el handoff guarda `servicio_id` y no guarda `fromMonitorista`/`toMonitorista` en el JSON — solo guarda `asignado_a` (nombre, no ID).

4. **Sin conciliación post-handoff**: No hay feedback de cuántos servicios quedaron visibles vs invisibles.

---

## Cambios

### 1. Migrar deactivate a patrón "by servicio_id" (`useShiftHandoff.ts`)

Cambiar lineas 220-222 y 232-235: en lugar de `.eq('id', svc.assignment_id)`, usar el patrón seguro:
```sql
.eq('servicio_id', svc.servicio_id).eq('activo', true)
```
Esto garantiza que se desactiva la asignación **actual** del servicio, sin importar si OrphanGuard la movió.

### 2. Guard freeze durante handoff (`useOrphanGuard.ts`)

- Exportar un ref/store `handoffInProgress` (simple module-level `Set<string>` de service IDs).
- `useShiftHandoff`: al iniciar mutación, poblar el set con los service IDs involucrados; al finalizar (success/error), vaciar.
- OrphanGuard/BalanceGuard: filtrar `handoffInProgress` de sus candidatos antes de mutar.

Implementación: usar un simple module-level export en un archivo compartido `src/lib/handoffLock.ts` (un `Set<string>` + funciones `lock`/`unlock`).

### 3. Fix revert para usar datos correctos (`useShiftHandoff.ts` + `useRevertHandoff.ts`)

- En handoff, guardar `fromMonitoristaId` y `toMonitoristaId` en cada entrada de `servicios_transferidos`.
- En revert, usar `t.servicio_id` (no `t.servicioId`), `t.fromMonitoristaId`, `t.toMonitoristaId`.
- Revert también usa patrón deactivate-by-servicio.

### 4. Conciliación post-handoff (UI en `ShiftHandoffDialog.tsx`)

Después de `executeHandoff.onSuccess`, antes de cerrar:
- Mostrar un "resumen de salud" con: N transferidos, N cerrados, N con incidentes heredados.
- Pequeño delay (2s) antes de auto-cerrar para que el coordinador vea el resultado.

### 5. Handle 23505 en insert de asignación

Wrap el insert en try/catch, si error code `23505` → el servicio ya tiene asignación activa → skip silenciosamente y contar como "conflicto resuelto".

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/handoffLock.ts` | **Nuevo** — Set + lock/unlock |
| `src/hooks/useShiftHandoff.ts` | Deactivate by servicio_id, freeze lock, guardar IDs en JSON, handle 23505 |
| `src/hooks/useOrphanGuard.ts` | Filtrar `handoffInProgress` en OrphanGuard y BalanceGuard |
| `src/hooks/useRevertHandoff.ts` | Fix campo names, deactivate by servicio_id |
| `src/components/monitoring/bitacora/ShiftHandoffDialog.tsx` | Resumen post-handoff antes de cerrar |

Sin migraciones SQL requeridas — los cambios son puramente en la lógica del cliente.

