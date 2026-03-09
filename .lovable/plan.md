

# Auto-selección de monitorista saliente en Entrega de Turno

## Problema
Actualmente el Step 0 muestra todos los monitoristas en turno y el usuario debe seleccionar manualmente quién es el saliente. Un monitorista regular debería verse auto-seleccionado (solo él mismo), mientras que admin/owner/coordinador_operaciones pueden elegir a cualquiera.

## Cambios

### `ShiftHandoffDialog.tsx`
1. Recibir el `userId` del usuario actual (ya disponible via `useUserRole`)
2. Importar `useUserRole` para obtener `userId` y `hasAnyRole`
3. Determinar si es "privileged" = tiene rol `admin`, `owner`, `coordinador_operaciones`, o `monitoring_supervisor`
4. En el `useEffect` de reset (línea 47-56):
   - Si **no** es privileged y no es `selfMonitoristaId` mode: auto-seleccionar al monitorista cuyo `id === userId`
   - Si es privileged: dejar la selección libre (como hoy)
5. En el `toggleSaliente` (línea 78-85):
   - Si no es privileged: bloquear toggle (como ya se hace con `selfMonitoristaId`)
6. En la lista de monitoristas salientes (línea 140):
   - Si no es privileged: mostrar solo el monitorista actual (filtrar por `m.id === userId`)
   - Si es privileged: mostrar todos los que están en turno (comportamiento actual)

Esto unifica el comportamiento de `selfMonitoristaId` con la detección automática del usuario, sin necesidad de pasar el prop externamente para el caso regular.

| Archivo | Cambio |
|---------|--------|
| `ShiftHandoffDialog.tsx` | Importar `useUserRole`, auto-detect usuario, restringir selección para no-privileged |

