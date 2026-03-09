

# Visibilidad de Botones de Pausa para Coordinadores

## Problema

Los botones de Pausa (Comida, Baño, Descanso Visual) están condicionados a `myAssignments.length > 0` en `MonitoristaAssignmentBar.tsx` línea 198. Como los coordinadores típicamente no tienen servicios asignados personalmente, el dropdown de Pausa nunca se renderiza para ellos.

## Solución

En `MonitoristaAssignmentBar.tsx`, mover el dropdown de Pausa fuera del bloque condicional de `myAssignments.length > 0`, para que esté disponible siempre que no haya una pausa activa. La lógica queda:

- **Pausa activa** → mostrar countdown + botón Retomar (sin cambios)
- **Sin pausa activa** → mostrar siempre el dropdown de Pausa + badge de asignados (si los hay) + botón "Entregar mi turno" (si hay asignaciones y no es coordinador)

| Archivo | Cambio |
|---------|--------|
| `MonitoristaAssignmentBar.tsx` | Mover el `DropdownMenu` de Pausa fuera del condicional `myAssignments.length > 0` para que sea visible siempre |

