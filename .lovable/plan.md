

# Conflictos de horario como advertencia, no como bloqueo

## Problema

Cuando el sistema detecta un conflicto de horario (ej: Rodrigo Rainier ya tenía un servicio matutino), el custodio se mueve a la sección colapsada "noDisponibles" y queda oculto de la lista principal. El equipo de planeación tiene que expandir la sección, buscar el custodio, y pasar por un modal de justificación — un flujo confuso que les impide trabajar con agilidad.

Además, el RPC usa una ventana fija de 4 horas para cada servicio, lo que puede generar falsos positivos cuando un servicio matutino ya finalizó pero su ventana teórica aún "cubre" horario.

## Solución

Mover los custodios con conflicto horario de `noDisponibles` a `ocupados` (visibles en la lista principal), con un badge de advertencia visual. Eliminar la necesidad del modal de justificación obligatorio — el planner puede seleccionarlos directamente con un click, igual que cualquier otro custodio.

### Cambios

**1. `src/hooks/useProximidadOperacional.ts`** (~líneas 308-313)
- Cuando se detecta conflicto horario (`esConflictoHorario`), cambiar la categoría de `no_disponible` a `ocupado`
- Mantener `conflictos_detectados = true` para el badge visual, pero NO para bloquear
- Esto hace que el custodio aparezca en la lista principal (sección "ocupados") en vez de ocultarse

**2. `src/hooks/useProximidadOperacional.ts`** (~líneas 543-549)
- Remover `custodio.conflictos_detectados` como condición para enviar a `noDisponibles`
- Solo `temporalmente_indisponible` (indisponibilidades reales como falla mecánica) va a `noDisponibles`

**3. `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx`**
- Cuando `conflictos_detectados === true` y categoría es `ocupado`, mostrar un badge amber "⚠️ Conflicto horario" en la tarjeta (informativo, no bloqueante)
- El custodio sigue siendo seleccionable con click normal

**4. `src/components/planeacion/PendingAssignmentModal.tsx`** y `src/components/planeacion/ReassignmentModal.tsx`
- Mismo comportamiento: custodios con conflicto aparecen en lista principal con badge de advertencia
- Click directo para asignar sin modal de justificación

### Lo que NO cambia
- La sección `ConflictSection` colapsable sigue existiendo para indisponibilidades reales (falla mecánica, etc.)
- El `ConflictOverrideModal` se mantiene en el código pero ya no se invoca para conflictos de horario simples
- El RPC sigue detectando conflictos (dato útil para auditoría), solo cambia cómo el frontend los trata

### Resultado
El planner ve todos los custodios en la lista principal. Los que tienen conflicto horario muestran un badge amber informativo pero son 100% seleccionables con un click, sin justificación obligatoria.

