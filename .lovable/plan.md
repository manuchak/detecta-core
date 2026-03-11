

# Add Communication Button to "Por Iniciar" and "Evento Especial" Cards

## Context
The `ServiceCommSheet` (chat + client report) is currently wired only into `ServiceCardActive` and `ServiceCardEnDestino`. The "Por Iniciar" and "Evento Especial" cards have no way to open the communication panel, even though a monitorist may need to contact the custodio before a service starts or during a special event.

## Changes

### 1. `ServiceCardPending.tsx`
- Import `ServiceCommSheet`, `useUnreadCounts`, and `MessageCircle` icon
- Add a chat icon button (matching the style used in Active/EnDestino cards) with unread badge
- Wire `ServiceCommSheet` with `commOpen` state

### 2. `ServiceCardSpecialEvent.tsx`
- Same integration: import `ServiceCommSheet`, `useUnreadCounts`, `MessageCircle`
- Add chat button in the card header row (next to the event badge/timer)
- Wire `ServiceCommSheet` with `commOpen` state

Both cards already have `service.id_servicio` available, which is all `ServiceCommSheet` needs.

