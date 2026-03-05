

# Hoja de Seguimiento Operativo -- Bitacora Board v2

## Vision Summary

Replace the current single-service carousel (`BitacoraPanel`) with a 3-column real-time monitoring board that tracks the full lifecycle of a service: **Pendiente de Inicio --> En Curso --> Evento Especial**, plus two lifecycle milestones that complete the cycle: **Llegada a Destino** and **Liberacion del Custodio**. Includes monitorist assignment, shift handoff, and architectural foundations for passive geofencing.

---

## 1. Service Lifecycle (State Machine)

The board models a strict state machine for each service. Every transition requires a **double confirmation** (button + confirmation dialog) to prevent accidental state changes.

```text
                    ┌──────────────┐
                    │  POR INICIAR │  hora_inicio_real IS NULL
                    │  (Column 1)  │  custodio_asignado IS NOT NULL
                    └──────┬───────┘
                           │ [Confirmar Inicio]
                           ▼
                    ┌──────────────┐     [Evento Especial]     ┌──────────────────┐
                    │   EN CURSO   │ ◄──────────────────────── │ EVENTO ESPECIAL  │
                    │  (Column 2)  │ ──────────────────────► │   (Column 3)     │
                    │  Timer 30min │     [Cerrar Evento]       │   Timer evento   │
                    └──────┬───────┘                           └──────────────────┘
                           │ [Llegada a Destino]
                           ▼
                    ┌──────────────┐
                    │ EN DESTINO   │  Blocked: no special events allowed
                    │  (Column 2,  │  Different card variant: "awaiting release"
                    │   badge)     │
                    └──────┬───────┘
                           │ [Liberar Custodio]
                           ▼
                    ┌──────────────┐
                    │  COMPLETADO  │  hora_fin_real IS NOT NULL
                    │ (leaves      │  estado_planeacion = 'completado'
                    │  board)      │
                    └──────────────┘
```

### Transition Rules & Guards

| Transition | Guard | Double-Confirm | DB Update |
|---|---|---|---|
| Por Iniciar --> En Curso | Must have custodio_asignado | Dialog: "Confirmar inicio de servicio para {cliente}?" | `hora_inicio_real = now()` + insert `inicio_servicio` event |
| En Curso --> Evento Especial | No other active event (hora_fin IS NULL) for this service | Auto (button click creates event) | Insert `servicio_eventos_ruta` with tipo and `hora_fin = NULL` |
| Evento Especial --> En Curso | Event must have tipo_evento filled | Dialog: "Cerrar evento {tipo}?" | `UPDATE hora_fin = now()` on the active event |
| En Curso --> En Destino | No active special events open | Dialog: "Confirmar llegada a destino?" | Insert `llegada_destino` event + set flag |
| En Destino --> Completado | Must be in destino state | Dialog: "Liberar custodio y cerrar servicio?" | `hora_fin_real = now()`, `estado_planeacion = 'completado'`, insert `fin_servicio` event |

**Critical: "En Destino" blocks special event buttons.** Once arrived at destination, the service enters a wind-down phase where only "Liberar Custodio" is available. This prevents nonsensical events like "combustible" after arrival.

---

## 2. Schema Changes

### 2a. New enum values for `tipo_evento_ruta`

Add `llegada_destino` and `liberacion_custodio` to capture the two missing lifecycle events:

```sql
ALTER TYPE tipo_evento_ruta ADD VALUE 'llegada_destino';
ALTER TYPE tipo_evento_ruta ADD VALUE 'liberacion_custodio';
```

### 2b. New table: `bitacora_asignaciones_monitorista`

Tracks which monitorist is watching which services, enabling shift handoff and coordinator oversight.

```sql
CREATE TABLE public.bitacora_asignaciones_monitorista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id text NOT NULL,
  monitorista_id uuid NOT NULL REFERENCES auth.users(id),
  asignado_por uuid REFERENCES auth.users(id),
  turno text NOT NULL DEFAULT 'matutino',  -- matutino, vespertino, nocturno
  activo boolean NOT NULL DEFAULT true,
  inicio_turno timestamptz NOT NULL DEFAULT now(),
  fin_turno timestamptz,
  notas_handoff text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bitacora_asignaciones_monitorista ENABLE ROW LEVEL SECURITY;

-- RLS: monitoring roles can read, coordinadores can assign
CREATE POLICY "monitoring_read" ON bitacora_asignaciones_monitorista
  FOR SELECT TO authenticated
  USING (public.has_monitoring_role(auth.uid()));

CREATE POLICY "coordinador_manage" ON bitacora_asignaciones_monitorista
  FOR ALL TO authenticated
  USING (public.has_monitoring_write_role(auth.uid()));
```

### 2c. New column on `servicios_planificados`

```sql
ALTER TABLE servicios_planificados
  ADD COLUMN IF NOT EXISTS en_destino boolean DEFAULT false;
```

This flag distinguishes "En Curso" from "En Destino" within Column 2. It's set to `true` when `llegada_destino` event is inserted, and prevents further special events.

---

## 3. Component Architecture

```text
BitacoraBoard.tsx                    (Layout: 3-column grid)
├── BoardColumnPorIniciar.tsx        (Column 1: pending services)
│   └── ServiceCardPending.tsx       (Compact card with "Iniciar" button)
├── BoardColumnEnCurso.tsx           (Column 2: active services, 2-col inner grid)
│   ├── ServiceCardActive.tsx        (Timer, quick report, special event buttons)
│   └── ServiceCardEnDestino.tsx     (Variant: arrived, only "Liberar" button)
├── BoardColumnEventoEspecial.tsx    (Column 3: services with open events)
│   └── ServiceCardSpecialEvent.tsx  (Event timer, close button)
├── InlineReportControl.tsx          (Drag/paste photo + location + submit)
├── MonitoristaAssignmentBar.tsx     (Top bar: current monitorist, shift, assign)
└── ConfirmTransitionDialog.tsx      (Reusable double-confirm dialog)
```

### Hook: `useBitacoraBoard.ts`

Central data hook:

1. **Query 1: "Por Iniciar"** -- `servicios_planificados` where `hora_inicio_real IS NULL`, `custodio_asignado IS NOT NULL`, `estado_planeacion IN ('confirmado','planificado')`, `fecha_hora_cita` within a configurable window (default +-6h)
2. **Query 2: "En Curso"** -- `hora_inicio_real IS NOT NULL`, `hora_fin_real IS NULL`, `estado_planeacion NOT IN ('cancelado','completado')`
3. **Query 3: Active events** -- `servicio_eventos_ruta` where `hora_fin IS NULL` (grouped by servicio_id)
4. **Query 4: Last event per service** -- For timer calculation (minutes since last action)
5. **Realtime subscriptions** on both `servicios_planificados` and `servicio_eventos_ruta` for automatic card movement

**Computed state per service:**

```typescript
interface BoardService {
  // ... service fields
  phase: 'por_iniciar' | 'en_curso' | 'en_destino' | 'evento_especial';
  activeEvent: EventoRuta | null;        // Open special event
  lastEventAt: Date | null;              // For inactivity timer
  minutesSinceLastAction: number;
  alertLevel: 'normal' | 'warning' | 'critical';  // 30min / 45min thresholds
  monitorista: string | null;            // Assigned monitorist name
}
```

**Actions exposed:**

| Action | Guard | Effect |
|---|---|---|
| `iniciarServicio(id)` | Requires confirm dialog | UPDATE hora_inicio_real, INSERT inicio_servicio event |
| `registrarCheckpoint(id, data)` | Service must be en_curso | INSERT checkpoint event with photo/coords |
| `iniciarEventoEspecial(id, tipo)` | No active event, not en_destino | INSERT event without hora_fin |
| `cerrarEventoEspecial(eventoId)` | Requires confirm dialog | UPDATE hora_fin on event |
| `registrarLlegadaDestino(id)` | No active special events, requires confirm | INSERT llegada_destino event, UPDATE en_destino=true |
| `liberarCustodio(id)` | Must be en_destino, requires confirm | INSERT liberacion_custodio + fin_servicio events, UPDATE hora_fin_real, estado_planeacion='completado' |

### Hook: `useMonitoristaAssignment.ts`

- Query `bitacora_asignaciones_monitorista` for current user (monitorist view) or all active (coordinator view)
- Actions: `assignService(servicioId, monitoristaId)`, `handoffTurno(fromId, toId, notas)`, `endTurno()`
- Coordinator console: list all monitorists with their assigned service counts

---

## 4. Column Details

### Column 1: Por Iniciar (~15% width)

- Sorted by `fecha_hora_cita` ascending (closest appointment first)
- Card shows: appointment time, client name, custodian name, origin-->destination
- Color coding: green if >30min to appointment, amber if <30min, red if past due
- Single action: "Iniciar" button (opens confirm dialog)
- **On confirm**: optimistic UI moves card to Column 2 immediately, then DB write

### Column 2: En Curso (~60% width, 2-column inner grid)

Two card variants coexist:

**Active card (`ServiceCardActive`):**
- Header: Folio, client, custodian
- **Inactivity timer**: Large, prominent. Counts minutes since last event. Colors: green (<15min), amber (30min), red (45min), pulsing red (>60min)
- Quick action buttons row: `⛽ 🚻 ☕ 🛏️ ⚠️` (combustible, baño, descanso, pernocta, incidencia). Each click inserts an event and moves the card to Column 3
- Inline report area: description + coords + drag/paste photo zone
- "Llegada a Destino" button (bottom, distinct style -- e.g., teal/green outline)

**Arrived card (`ServiceCardEnDestino`):**
- Same header but with a teal "EN DESTINO" badge
- Timer shows time since arrival
- **No special event buttons** (disabled/hidden)
- Single action: "Liberar Custodio" button (prominent, final action)
- On liberation: card exits the board entirely

### Column 3: Evento Especial (~25% width)

- Card shows: event type icon + label, event timer (duration of the open event), client/custodian context
- Description field to add notes to the event
- Photo upload zone (drag/paste)
- "Cerrar Evento" button (with confirm dialog)
- **Escalation alert**: if event open > 15min for routine (combustible/baño), or > 30min for any, show amber border. > 45min show red pulsing border. Toast notification to coordinator at 30min threshold.

---

## 5. InlineReportControl (Quick Checkpoint)

Compact control embedded in each active card:

- **Description**: Text input, auto-suggests last description
- **Coordinates**: Single field parsing Google Maps links or "lat,lng" strings. Button to request browser geolocation
- **Photo**: Drop zone supporting:
  - Drag-and-drop files
  - Clipboard paste (Ctrl+V / Cmd+V)
  - File picker fallback
  - Canvas compression (~400KB, 1920x1080, 0.7 quality) before upload to `ticket-evidencias` bucket
- **Submit**: Inserts `checkpoint` event with all data. Resets form. Updates inactivity timer

---

## 6. Monitorist Assignment & Shift Handoff

### Top bar: `MonitoristaAssignmentBar`

For **monitorists**: Shows "Tu turno: Matutino | 5 servicios asignados"

For **coordinators**: Shows assignment console:
- List of active monitorists with service counts
- Drag-drop or select to reassign services between monitorists
- "Cambio de Turno" button: opens handoff dialog

### Shift Handoff Flow

1. Outgoing monitorist clicks "Entregar Turno"
2. Dialog shows: list of their active services with current status
3. Handoff notes textarea (mandatory if any service has warning/critical alert)
4. Select incoming monitorist from dropdown
5. On confirm: `fin_turno = now()` on old assignment, create new assignment for incoming monitorist with `notas_handoff`
6. Incoming monitorist sees a toast: "Turno recibido de {nombre} - {n} servicios activos"

### Coordinator Console (future-ready)

The assignment table supports a dedicated coordinator view showing all monitorists, their assigned services, and shift history. This is architecturally ready but not built in this phase -- the data layer and UI hooks will be complete.

---

## 7. Passive Geofencing (Architecture Only -- Not Implemented)

Design the data model and hooks, but do not build the UI or background worker in this phase.

### Prepared schema:

```sql
-- Future: geofence_zones table for corridor checkpoints
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radio_metros integer NOT NULL DEFAULT 500,
  tipo text NOT NULL DEFAULT 'checkpoint', -- checkpoint, restricted, destination
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### Prepared hook interface (stub only):

```typescript
// usePassiveGeofencing.ts -- stub for future implementation
// Will use navigator.geolocation.watchPosition() on custodian devices
// to auto-insert checkpoint events when entering/exiting geofence zones
```

The `servicio_eventos_ruta` table already supports this: events would be inserted with `registrado_por = custodio_user_id` and `tipo_evento = 'checkpoint'` automatically.

---

## 8. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Monitorist refreshes page mid-service | All state is server-side. Board reconstructs from queries. No client-side state loss. |
| Two monitorists try to start same service | First write wins (hora_inicio_real != NULL). Second gets toast: "Servicio ya iniciado" |
| Network failure during event creation | Mutation retry with exponential backoff. Toast: "Reintentando..." If persistent, show red banner. |
| Special event left open at shift end | Handoff dialog warns: "{n} eventos especiales abiertos". Incoming monitorist sees them in Column 3. |
| Service cancelled while in board | Realtime subscription detects `estado_planeacion = 'cancelado'`. Card removed with fade animation + toast. |
| Custodio not assigned but service is "confirmado" | Does NOT appear in Column 1 (guard: `custodio_asignado IS NOT NULL`) |
| Accidental double-click on transitions | All transition buttons disable immediately on click (`isPending` state). Confirm dialogs prevent the action from firing without explicit confirmation. |
| Browser tab in background > 5 min | `visibilitychange` listener recalculates all timers on return to tab. Prevents stale timers. |
| Photo upload fails | Toast error with retry button. Event is still created without photo. Photo can be added later via edit. |

---

## 9. Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/xxx.sql` | Create | Schema: new enum values, `bitacora_asignaciones_monitorista` table, `en_destino` column, geofence_zones table |
| `src/hooks/useBitacoraBoard.ts` | Create | Central data hook with queries, realtime, computed state, actions |
| `src/hooks/useMonitoristaAssignment.ts` | Create | Assignment and handoff logic |
| `src/hooks/useEventosRuta.ts` | Modify | Add `llegada_destino` and `liberacion_custodio` to `TipoEventoRuta` type and `EVENTO_ICONS` |
| `src/components/monitoring/bitacora/BitacoraBoard.tsx` | Create | 3-column layout with MonitoristaAssignmentBar |
| `src/components/monitoring/bitacora/BoardColumnPorIniciar.tsx` | Create | Column 1 |
| `src/components/monitoring/bitacora/BoardColumnEnCurso.tsx` | Create | Column 2 with 2-col inner grid |
| `src/components/monitoring/bitacora/BoardColumnEventoEspecial.tsx` | Create | Column 3 |
| `src/components/monitoring/bitacora/ServiceCardPending.tsx` | Create | Pending service card |
| `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Create | Active service card with timer and controls |
| `src/components/monitoring/bitacora/ServiceCardEnDestino.tsx` | Create | Arrived card with release button |
| `src/components/monitoring/bitacora/ServiceCardSpecialEvent.tsx` | Create | Special event card with close button |
| `src/components/monitoring/bitacora/InlineReportControl.tsx` | Create | Drag/paste photo + coords + description |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Create | Top bar for shift info and coordinator controls |
| `src/components/monitoring/bitacora/ConfirmTransitionDialog.tsx` | Create | Reusable confirmation dialog for state transitions |
| `src/components/monitoring/bitacora/BitacoraPanel.tsx` | Modify | Replace content with `BitacoraBoard` |
| `src/components/monitoring/bitacora/index.ts` | Modify | Export new components |

No changes to existing event registration logic (EventTracker, EventTimeline remain as secondary/detail views accessible from drawers).

