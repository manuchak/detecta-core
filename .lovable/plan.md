

# Coordinator Console for Monitorist Assignment & Shift Management

## What exists today

- `MonitoristaAssignmentBar` is a read-only bar showing the current monitorist's shift and count of assigned services
- `useMonitoristaAssignment` hook has the data layer ready: `allAssignments`, `assignService`, `handoffTurno`, `endTurno`
- The `bitacora_asignaciones_monitorista` table exists with RLS
- No UI exists for coordinators to assign services, view monitorist workloads, or manage shift handoffs
- No handoff dialog exists anywhere in the codebase

## What to build

### 1. Expand `MonitoristaAssignmentBar.tsx`

Detect if user has coordinator role (`monitoring_supervisor`, `coordinador_operaciones`, `admin`, `owner`). If so, render an expanded bar with:
- Summary chips per active monitorist (name + service count + shift)
- "Asignar Servicios" button opening the assignment dialog
- "Cambio de Turno" button opening the handoff dialog

For regular monitorists, keep the current compact view.

### 2. New: `CoordinatorAssignmentDialog.tsx`

A dialog showing:
- Left panel: list of unassigned active services (services in "en_curso" that have no active row in `bitacora_asignaciones_monitorista`)
- Right panel: monitorists with their current service lists
- Action: select a service and a monitorist, click "Asignar" to create the assignment
- Query `user_roles` for users with `monitoring` or `monitoring_supervisor` roles, join with `profiles` for display names

### 3. New: `ShiftHandoffDialog.tsx`

Dialog for shift handoff:
- Shows list of outgoing monitorist's active services with current status/alert level
- Textarea for handoff notes (mandatory if any service has warning/critical alert)
- Dropdown to select incoming monitorist
- On confirm: closes old assignments (`activo=false, fin_turno=now()`), creates new ones for incoming monitorist with handoff notes
- Toast to confirm handoff

### 4. Expand `useMonitoristaAssignment.ts`

Add:
- `monitoristas` query: fetches users with monitoring roles from `user_roles` + `profiles` (id, display_name, role)
- `unassignedServices` computed: cross-reference active board services vs active assignments to find unassigned ones
- `reassignService` mutation: close old assignment + create new one

### 5. Sign out the current user

Execute a sign-out so you can re-login as admin.

## Files

| File | Action |
|---|---|
| `src/hooks/useMonitoristaAssignment.ts` | Modify -- add monitoristas query, unassigned logic |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Modify -- coordinator expanded view |
| `src/components/monitoring/bitacora/CoordinatorAssignmentDialog.tsx` | Create -- service assignment UI |
| `src/components/monitoring/bitacora/ShiftHandoffDialog.tsx` | Create -- shift handoff UI |
| `src/components/monitoring/bitacora/index.ts` | Modify -- export new components |

