

# Filtrar tablero de bitácora por monitorista asignado

## Problema actual
`useBitacoraBoard.ts` consulta `servicios_planificados` sin filtro de monitorista. Todos los usuarios con rol `monitoring` ven todos los servicios del dia.

## Solución
Para el rol `monitoring` (no supervisor/coordinador/admin), filtrar los 3 queries del tablero para que solo devuelvan servicios que están asignados al monitorista autenticado en `bitacora_asignaciones_monitorista`.

### Lógica

1. **Detectar rol**: Si el usuario es `monitoring`, activar filtro. Si es `monitoring_supervisor`, `coordinador_operaciones`, `admin` u `owner`, mostrar todo (como hoy).

2. **Filtrar servicios**: Antes de construir los resultados, obtener los `servicio_id` asignados al monitorista actual desde `bitacora_asignaciones_monitorista` donde `activo = true` y `monitorista_id = auth.uid()`. Luego filtrar las queries Q1 (pending) y Q2 (active) para solo incluir esos `servicio_id`.

### Cambios

**`src/hooks/useBitacoraBoard.ts`**:

1. Importar `useAuth` para obtener `userRole` y `user.id`
2. Agregar una query previa: obtener `servicio_id[]` desde `bitacora_asignaciones_monitorista` donde `monitorista_id = userId` y `activo = true` (solo si rol es `monitoring`)
3. En `pendingQuery` y `activeQuery`, agregar `.in('id_servicio', assignedIds)` cuando el rol es `monitoring`
4. Si no hay asignaciones, devolver arrays vacíos

El coordinador y admin siguen viendo todo sin cambios.
