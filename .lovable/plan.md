

# Panel de Coordinación Operativa — Command Center para el C4

## Análisis del diagrama vs. sistema actual

Tu diagrama describe 4 carriles (User, C4, Coordinación C4, Custodio) con estos pasos clave:

1. Cliente cierra solicitud → Planificación asigna servicio (ya existe)
2. Coordinador recibe demanda → analiza carga → asigna balanceadamente a monitoristas (existe parcialmente: el `CoordinatorAssignmentDialog` actual es funcional pero primitivo — asignación uno-a-uno, sin visibilidad de carga ni turno)
3. Monitorista ejecuta ciclo de monitoreo (ya existe en BitacoraBoard)
4. Cambio de guardia: saliente cierra pendientes → genera reporte → entrante toma servicios (existe básico en `ShiftHandoffDialog`)

### Brechas identificadas

| Capacidad del diagrama | Estado actual | Gap |
|---|---|---|
| Visibilidad de demanda vs. capacidad | No existe | **Crítico** — El coordinador no ve cuántos servicios hay por turno ni cuántos monitoristas disponibles |
| Asignación balanceada | Manual uno-a-uno | **Alto** — Sin auto-balance ni drag-and-drop |
| Turno activo por monitorista | Se infiere del assignment | **Medio** — No hay registro explícito de "quién está en turno ahora" |
| Reporte de entrega de turno | Solo notas en texto | **Medio** — Falta resumen visual de servicios transferidos vs cerrados |
| Monitorista ve SUS servicios filtrados | No existe | **Alto** — Todos ven todo, sin scope personal |

### Mejoras sugeridas al flujo (como Head de Producto)

1. **Auto-balance inteligente**: En lugar de asignar manualmente, el coordinador debería poder hacer "Distribuir todos" y el sistema reparte equitativamente por carga actual. La asignación manual queda como override.

2. **Turno como estado explícito**: Un monitorista debe "fichar entrada" a su turno, haciendo visible quiénes están activos en este momento vs. quiénes tienen rol pero no están en turno.

3. **Vista personal del monitorista**: Cuando un `monitoring` entra a la bitácora, debería ver primero SUS servicios asignados destacados. La vista actual muestra todo sin distinción.

4. **Handoff con resumen automático**: Al transferir turno, generar un resumen estructurado (N servicios en curso, N en destino, N con evento especial abierto) en lugar de depender de texto libre.

---

## Plan de implementación: Panel de Coordinación v2

### Fase 1 — Panel dedicado (reemplaza el dialog actual)

Crear una **vista de página completa** tipo Command Center en lugar del dialog modal actual. Layout Apple-inspired:

```text
┌─────────────────────────────────────────────────────┐
│ ● Coordinación C4              Turno: Vespertino  ▼ │
├───────────────────────┬─────────────────────────────┤
│  MONITORISTAS EN      │  SERVICIOS SIN ASIGNAR      │
│  TURNO (3 activos)    │  ┌──────────────────────┐   │
│                       │  │ Folio · Cliente      │   │
│  ┌─ Ana M. ──────┐   │  │ Custodio · Hora cita │   │
│  │ ● En turno     │   │  │        [Asignar ▼]   │   │
│  │ 4 servicios    │   │  └──────────────────────┘   │
│  │ ██████░░ carga │   │  ┌──────────────────────┐   │
│  └────────────────┘   │  │ ...                  │   │
│  ┌─ Carlos R. ───┐   │  └──────────────────────┘   │
│  │ ● En turno     │   │                             │
│  │ 6 servicios    │   │  ─── ó ───                  │
│  │ █████████ carga│   │                             │
│  └────────────────┘   │  [⚡ Auto-distribuir]       │
│  ┌─ Laura P. ────┐   │                             │
│  │ ○ Sin turno    │   │                             │
│  └────────────────┘   │                             │
├───────────────────────┴─────────────────────────────┤
│  DISTRIBUCIÓN ACTUAL          [🔄 Cambio de Turno]  │
│  Ana: ████ 4  Carlos: ██████ 6  Laura: ░░ 0       │
└─────────────────────────────────────────────────────┘
```

### Componentes nuevos

| Componente | Propósito |
|---|---|
| `CoordinatorCommandCenter.tsx` | Layout principal con 2 paneles (monitoristas + servicios sin asignar) |
| `MonitoristaCard.tsx` | Tarjeta de monitorista con indicador de turno, barra de carga, lista colapsable de sus servicios |
| `UnassignedServiceRow.tsx` | Fila de servicio sin asignar con dropdown para asignar rápido a un monitorista |
| `AutoDistributeButton.tsx` | Lógica de distribución equitativa: reparte servicios sin asignar priorizando monitoristas con menor carga |
| `ShiftHandoffPanel.tsx` | Versión mejorada del handoff con resumen automático (reemplaza el dialog) |

### Lógica de auto-distribución

```text
servicios_sin_asignar.sort(por hora_cita ASC)
para cada servicio:
  monitorista = monitoristas_en_turno.sort(por carga ASC)[0]
  asignar(servicio, monitorista)
```

### Cambios en hook `useMonitoristaAssignment`

- Agregar campo `en_turno: boolean` al query de monitoristas (derivado de si tiene asignaciones activas con `inicio_turno` dentro de las últimas 8h, o un campo explícito)
- Agregar mutation `autoDistribute` que toma los servicios sin asignar y ejecuta la lógica de balance
- Agregar query para obtener el turno actual (matutino/vespertino/nocturno) basado en la hora

### Integración con BitacoraBoard

- El `MonitoristaAssignmentBar` actual se mantiene como barra compacta en la Bitácora
- El botón "Asignar" abre el nuevo `CoordinatorCommandCenter` como panel lateral o página dedicada en lugar del dialog simple
- Para monitoristas regulares: agregar highlight visual en las tarjetas de servicios que les están asignados (borde coloreado o badge con su nombre)

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/components/monitoring/coordinator/CoordinatorCommandCenter.tsx` | **Crear** — Panel principal |
| `src/components/monitoring/coordinator/MonitoristaCard.tsx` | **Crear** — Tarjeta de monitorista con barra de carga |
| `src/components/monitoring/coordinator/UnassignedServiceRow.tsx` | **Crear** — Servicio sin asignar |
| `src/components/monitoring/coordinator/AutoDistributeButton.tsx` | **Crear** — Botón de auto-distribución |
| `src/components/monitoring/coordinator/ShiftHandoffPanel.tsx` | **Crear** — Panel de handoff mejorado |
| `src/hooks/useMonitoristaAssignment.ts` | **Modificar** — Agregar autoDistribute, mejorar queries |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | **Modificar** — Abrir CommandCenter en vez de dialog |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | **Modificar** — Badge visual de monitorista asignado |

### Sin cambios de backend

Toda la data necesaria ya existe en `bitacora_asignaciones_monitorista`, `servicios_planificados`, `user_roles` y `profiles`. Los permisos RLS ya están correctos tras la migración anterior.

