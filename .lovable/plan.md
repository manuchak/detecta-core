

# Evaluación UX/UI Crítica + Plan de Overlay de Pausa

## Evaluación del estado actual

**Problemas identificados:**

1. **Visibilidad del estado de pausa es mínima** — Solo un Badge de 10px en la barra superior. Un monitorista que no mire esa esquina podría no saber que está en pausa.

2. **Los servicios siguen visibles durante la pausa** — Esto genera ansiedad innecesaria: el monitorista ve servicios "desaparecer" de su lista mientras se redistribuyen, o peor, ve servicios ajenos si el guard los reasigna de vuelta. La visibilidad de este proceso interno genera confusión operativa.

3. **No hay separación cognitiva** — El monitorista en pausa sigue viendo la misma interfaz de trabajo. Psicológicamente no "suelta" su turno.

## Evaluación de la propuesta

**La propuesta es correcta desde el punto de vista UX:**

- **Principio de "no preocupar al usuario"**: Ocultar el mecanismo interno de redistribución es la decisión correcta. El monitorista no necesita saber a quién se le asignaron sus servicios, solo que el sistema se encarga.
- **Reducción de carga cognitiva**: Durante una pausa de 10 minutos, ver un tablero vacío con un timer es más relajante que ver servicios moviéndose.
- **Prevención de errores**: Si el monitorista ve servicios durante su pausa, podría intentar operar sobre ellos, causando conflictos con quien los tiene asignados temporalmente.

**Un riesgo a mitigar:** El overlay debe ser lo suficientemente prominente para que el monitorista no piense que el sistema se rompió. El mensaje debe ser claro: "Estás en pausa, tus servicios están siendo atendidos".

## Cambios propuestos

### Archivo nuevo: `src/components/monitoring/bitacora/PauseOverlay.tsx`

Componente overlay de pantalla completa que se renderiza **sobre** el board cuando `pausaActiva` existe:

- Fondo semi-opaco con blur que cubre las 3 columnas del board
- Ícono grande del tipo de pausa (Sunrise/Coffee/Bath/Eye)
- Título: "Pausa de [tipo] activa"
- Countdown prominente en fuente monospaced grande (ej: `14:32`)
- Indicador de progreso circular o barra
- Si el tiempo se excede: cambio visual a rojo con pulso y mensaje "Tiempo excedido"
- Texto de tranquilidad: "Tus servicios están siendo atendidos por el equipo en turno"
- Botón "Retomar" prominente
- **Solo visible para rol `monitoring`** (no coordinadores, quienes necesitan ver todo)

### Archivo modificado: `src/components/monitoring/bitacora/BitacoraBoard.tsx`

- Importar `PauseOverlay` y `useMonitoristaPause`
- Cuando `pausaActiva` existe y el usuario NO es coordinador: renderizar el overlay sobre el grid de columnas
- Las columnas siguen montadas debajo (para que React Query no pierda estado), pero el overlay las cubre completamente

### Sin cambios en:
- `useMonitoristaPause.ts` (ya expone `pausaActiva`, `segundosRestantes`, `excedido`)
- `MonitoristaAssignmentBar.tsx` (mantiene su badge como respaldo, visible si el overlay falla)

