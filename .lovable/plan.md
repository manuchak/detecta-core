

# Fix: Workflow de Tickets — Asignación por defecto y visibilidad de nombres

## Problemas identificados

1. **Nombres no se muestran**: 12 de 17 tickets de custodios no tienen `custodio_id` enlazado, por lo que la conversación muestra "Usuario" en lugar del nombre real. El sistema ya intenta resolverlo en la creación (`normalizePhone`), pero falla para tickets creados antes de ese fix o cuando el teléfono no matchea.

2. **Sin asignación por defecto**: Cuando se crea un ticket, no se asigna a nadie. Daniela Castañeda (`df3b4dfc-c80c-45d0-8290-5d40341ab2ca`, rol `coordinador_operaciones`) debería ser la asignada por defecto para todos los tickets de custodios.

3. **Daniela no tiene acceso a /tickets**: Solo los roles `admin` y `owner` tienen el permiso `page:tickets`. Necesita acceso.

## Plan de corrección

### 1. Dar acceso a Daniela al módulo de tickets
- Insertar permisos `page:tickets` y `page:ticket-detail` para el rol `coordinador_operaciones` en `role_permissions`.

### 2. Auto-asignar tickets nuevos a Daniela
- En `useCustodianTicketsEnhanced.ts` → `createTicket()`: agregar `assigned_to: 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca'` al insert del ticket.

### 3. Resolver nombres de custodios para tickets existentes sin `custodio_id`
- Migración SQL: actualizar tickets con `custodio_id IS NULL` y `custodio_telefono IS NOT NULL` haciendo match por teléfono normalizado contra `custodios_operativos`.

### 4. Mejorar fallback de nombre en la conversación
- En `TicketDetailPage.tsx` línea 361: cuando `custodio?.nombre` y `customer_name` son null, intentar resolver el nombre desde `custodio_telefono` consultando `custodios_operativos` por teléfono como fallback.
- En `useCustodianTicketsEnhanced.ts` → `addResponse()` línea 382: cambiar `autor_nombre: 'Custodio'` por el nombre real del custodio (obtenerlo de la sesión o del ticket).

### 5. Asignar tickets existentes sin asignar a Daniela
- Migración SQL: `UPDATE tickets SET assigned_to = 'df3b4dfc-...' WHERE tipo_ticket = 'custodio' AND assigned_to IS NULL`.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useCustodianTicketsEnhanced.ts` | Auto-assign a Daniela en `createTicket()`, mejorar `autor_nombre` en `addResponse()` |
| `src/pages/Tickets/TicketDetailPage.tsx` | Fallback de nombre: si no hay custodio, buscar por `custodio_telefono` |
| `src/hooks/useTicketsEnhanced.ts` | En `fetchTicketById`: si `custodio_id` es null pero `custodio_telefono` existe, buscar custodio por teléfono |
| Nueva migración SQL | Permisos para `coordinador_operaciones`, backfill `custodio_id` y `assigned_to` en tickets existentes |

