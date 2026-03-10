

# Fix GRIAGEM-2: Corrección de datos + Auto-reparación de huérfanos

## Diagnóstico confirmado

GRIAGEM-2 (GREMSA) tiene **10+ asignaciones, TODAS con `activo: false`** — resultado del ping-pong pre-fix. El servicio está activo (`confirmado`, `hora_inicio_real: NULL`, `cita: 15:00 UTC`), pero:

- **No aparece en Coordinador** porque no tiene asignación activa
- **Sí aparece en Bitácora "Por Iniciar"** para coordinadores (vista "Todos"), pero **no** para ningún monitorista individual
- **OrphanGuard no lo recoge** porque su ventana es `cita ±2h/-30min` y GRIAGEM-2 ya pasó los -30min (cita fue hace >2h)

## Cambios

### 1. Data fix inmediato (insert tool)
Insertar asignación activa para GRIAGEM-2, asignándolo a uno de los 3 monitoristas con 7 servicios (ej: `1079b6f1` — Cintia Chavez).

### 2. `src/hooks/useOrphanGuard.ts` — Ampliar detección de huérfanos

Agregar **Rule 2b**: Detectar servicios pendientes (en el board) que tienen `custodio_asignado` pero **ninguna** asignación activa, sin importar la ventana de tiempo de la cita. Esto cubre el caso donde un servicio "se quedó atrás" después del ping-pong.

```text
// Pseudocódigo Rule 2b:
const pendingWithoutAssignment = pendingServiceIds.filter(id =>
  !effectiveAssigned.has(id) && !isRecentlyAutoAssigned(id)
);
// Merge con unassignedActive en allEligible
```

Actualmente solo `activeServiceIds` (en_curso) se revisa en Rule 2. Los `pendingServiceIds` solo se revisan con la ventana de 2h (Rule 1). El fix agrega los pending sin asignación directamente al pool elegible.

### Alcance
- 1 query de datos (insert assignment)
- ~3 líneas modificadas en `useOrphanGuard.ts` (agregar pending sin asignación a `allEligible`)

