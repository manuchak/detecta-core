

# Fix: Asignar todos los tickets a Daniela Castañeda

## Problema
El trigger de base de datos `auto_assign_and_set_sla` usa `get_least_loaded_agent()` para asignar tickets por balanceo de carga cuando `assigned_to IS NULL`. Esto causa asignación aleatoria entre agentes disponibles. Solo `useCustodianTicketsEnhanced.ts` fuerza a Daniela; otros paths (trigger DB, `useTickets.ts`, `useCustodianTickets.ts`) no lo hacen.

## Solución (2 cambios)

### 1. Migración SQL — Forzar Daniela en el trigger y backfill existentes
- Modificar `auto_assign_and_set_sla()` para que siempre asigne a Daniela (`df3b4dfc-c80c-45d0-8290-5d40341ab2ca`) cuando `assigned_to IS NULL`, en lugar de usar `get_least_loaded_agent`.
- UPDATE todos los tickets existentes que no estén asignados a Daniela para reasignarlos a ella.

### 2. Frontend — Hardcodear Daniela en hooks de creación
- `useTickets.ts` → `createTicket`: agregar `assigned_to: 'df3b4dfc-...'` al insert.
- `useCustodianTickets.ts` → `createTicket`: agregar `assigned_to: 'df3b4dfc-...'` al insert.
- (Ya está en `useCustodianTicketsEnhanced.ts`, sin cambios necesarios ahí.)

Esto garantiza que tanto el trigger DB como todos los paths de frontend apunten exclusivamente a Daniela.

