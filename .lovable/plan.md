

# Plan Maestro: Comunicación WhatsApp Multi-Fase — Número Único

## Resumen ejecutivo

Integrar los dos planes aprobados (routing multi-canal + gestión de clientes) en una implementación secuencial de 9 fases de desarrollo que transforme el sistema actual de comunicación WhatsApp de "solo custodio ↔ C4" a un sistema completo de 4 canales lógicos con routing inteligente, handoff Planeación → C4, y chat bidireccional con clientes.

## Estado actual confirmado

```text
whatsapp_messages
  ├── id, chat_id, message_id, sender_phone, sender_name
  ├── message_text, message_type, media_url
  ├── is_from_bot, is_read, delivery_status
  ├── servicio_id (FK), sent_by_user_id (FK)
  ├── ticket_id (FK), created_at
  └── ❌ NO tiene: comm_channel, comm_phase, sender_type

pc_clientes
  └── contacto_whatsapp ✅

pc_clientes_contactos
  └── id, cliente_id, nombre, email, telefono, rol, principal, activo

servicios_planificados
  └── telefono_cliente, custodio_telefono, hora_inicio_real, hora_fin_real, hora_llegada_custodio
```

El webhook actual solo busca custodios. Si un cliente escribe, cae a ticket genérico o se pierde.

---

## Fase Dev 1 — Modelo de datos (migración SQL)

Agregar 3 columnas a `whatsapp_messages` + índice compuesto + backfill de registros existentes.

**Migración:**
```sql
-- Nuevas columnas
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS comm_channel text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS comm_phase text DEFAULT 'sin_servicio',
  ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'unknown';

-- Índice para queries filtradas por canal
CREATE INDEX IF NOT EXISTS idx_wm_servicio_channel
  ON whatsapp_messages(servicio_id, comm_channel)
  WHERE servicio_id IS NOT NULL;

-- Backfill: mensajes existentes con servicio_id
UPDATE whatsapp_messages
SET comm_channel = CASE
      WHEN is_from_bot THEN 'custodio_c4'
      ELSE 'custodio_c4'
    END,
    comm_phase = 'en_servicio',
    sender_type = CASE
      WHEN is_from_bot THEN 'staff'
      ELSE 'custodio'
    END
WHERE servicio_id IS NOT NULL AND comm_channel = 'unknown';

-- Backfill: mensajes sin servicio (tickets)
UPDATE whatsapp_messages
SET sender_type = CASE WHEN is_from_bot THEN 'staff' ELSE 'custodio' END,
    comm_phase = 'sin_servicio'
WHERE servicio_id IS NULL AND sender_type = 'unknown';
```

**Archivos:** Solo migración SQL, sin cambios de código.

---

## Fase Dev 2 — Router de contexto en webhook

Refactorizar `handleIncomingMessage` en `kapso-webhook-receiver/index.ts` para clasificar cada mensaje entrante en 3 dimensiones: sender_type, comm_channel, comm_phase.

**Lógica de routing (pseudocódigo):**
```text
senderPhone (últimos 10 dígitos)
  │
  ├─ Match en profiles WHERE role='custodio'
  │   ├─ Servicio con hora_inicio_real NOT NULL, hora_fin_real IS NULL
  │   │   → sender_type='custodio', comm_channel='custodio_c4', comm_phase='en_servicio'
  │   ├─ Servicio asignado sin hora_inicio_real
  │   │   → sender_type='custodio', comm_channel='custodio_planeacion', comm_phase='pre_servicio'
  │   └─ Sin servicio → ticket (flujo actual)
  │
  ├─ Match en servicios_planificados.telefono_cliente (servicio activo)
  │   → sender_type='cliente', comm_channel='cliente_c4', comm_phase='en_servicio'
  │
  ├─ Match en pc_clientes.contacto_whatsapp o pc_clientes_contactos.telefono
  │   → Buscar servicio activo del cliente → vincular
  │   → Si no hay servicio activo → ticket de atención
  │
  └─ Desconocido → ticket genérico (flujo actual)
```

**Desambiguación multi-servicio:** Priorizar por `hora_inicio_real DESC` (el más reciente activo).

**Cambios en `messageRecord`:**
```typescript
const messageRecord = {
  ...existingFields,
  comm_channel: resolvedChannel,    // 'custodio_c4' | 'custodio_planeacion' | 'cliente_c4' | 'unknown'
  comm_phase: resolvedPhase,        // 'pre_servicio' | 'en_servicio' | 'post_servicio' | 'sin_servicio'
  sender_type: resolvedSenderType,  // 'custodio' | 'cliente' | 'staff' | 'sistema'
};
```

**Archivo:** `supabase/functions/kapso-webhook-receiver/index.ts`

---

## Fase Dev 3 — Clasificación en mensajes salientes

Agregar `comm_channel` al registro de mensajes en las edge functions de envío.

**`kapso-send-message/index.ts`:**
- Aceptar `context.comm_channel` en el request
- Registrarlo en `messageRecord.comm_channel`
- Default: `'custodio_c4'` si viene de ServiceCommSheet, `'cliente_c4'` si el destinatario es cliente

**`kapso-send-template/index.ts`:**
- Mismo patrón: aceptar y registrar `comm_channel`
- Templates de asignación/recordatorio → `'custodio_planeacion'`
- Templates de reporte al cliente → `'cliente_c4'`
- Templates de sistema → `'sistema'`

**Frontend - `ServiceCommSheet.tsx`:**
- Pasar `comm_channel: 'custodio_c4'` en context al enviar nudge/mensaje
- Pasar `comm_channel: 'cliente_c4'` al enviar reporte al cliente

**Archivos:** `kapso-send-message/index.ts`, `kapso-send-template/index.ts`, `ServiceCommSheet.tsx`

---

## Fase Dev 4 — Chat de Planeación con custodio

Nuevo componente `PlanningCustodioComm.tsx` integrado en `CustodianAssignmentStep.tsx` como sheet lateral para la conversación de validación de posicionamiento.

**Funcionalidad:**
- Filtrar mensajes por `servicio_id + comm_channel='custodio_planeacion'`
- Reutilizar estructura visual de `CustodioChat` (burbujas, timestamps, delivery ticks)
- Acciones rápidas: "¿Ya estás en posición?", "Envía foto del punto"
- Read-only después del handoff (cuando existe `hora_llegada_custodio`)

**`useServicioComm.ts`:**
- Agregar parámetro opcional `commChannel` al hook
- Filtrar query: `.eq('comm_channel', commChannel)` cuando se proporciona

**Archivos:**
- **NUEVO:** `src/components/planeacion/PlanningCustodioComm.tsx`
- `src/hooks/useServicioComm.ts` (agregar filtro por canal)
- `src/pages/Planeacion/components/workflow/CustodianAssignmentStep.tsx` (integrar sheet)

---

## Fase Dev 5 — Handoff Planeación → C4 con separadores visuales

Cuando Planeación marca "En Sitio":
1. Insertar mensaje de sistema en `whatsapp_messages`:
   ```typescript
   { message_text: '── Servicio transferido a Monitoreo ──',
     comm_channel: 'sistema', sender_type: 'sistema',
     comm_phase: 'en_servicio', is_from_bot: true }
   ```
2. `CustodioChat.tsx`: Renderizar separadores de fase cuando `comm_phase` cambia entre mensajes consecutivos

**Regla de bloqueo:** Después del handoff, `PlanningCustodioComm` deshabilita el composer (lógica frontend: `hora_llegada_custodio IS NOT NULL → read-only`). Validación en edge function: si `comm_channel='custodio_planeacion'` y el servicio tiene `hora_inicio_real`, rechazar con error.

**Archivos:**
- `CustodioChat.tsx` (separador de fase)
- `PlanningCustodioComm.tsx` (bloqueo post-handoff)
- Hook de Planeación que marca "En Sitio" (insertar mensaje sistema)
- `kapso-send-message/index.ts` (validación de canal vs fase)

---

## Fase Dev 6 — Tab Cliente bidireccional

Reemplazar `ClientReportComposer.tsx` con `ClientChat.tsx` — un chat bidireccional completo.

**Estructura UI:**
```text
┌─ Selector de contacto ──────────────────┐
│ ▾ María López (principal)               │
│   Carlos Ruiz (operativo)               │
│   +52 55 1234 (telefono_cliente)        │
└─────────────────────────────────────────┘

┌─ Timeline bidireccional ────────────────┐
│  📤 [Template] Reporte servicio   14:30 │
│  📥 "¿A qué hora llegan?"  14:35       │
│  📤 "Estimamos 16:00"      14:36       │
└─────────────────────────────────────────┘

┌─ Composer ──────────────────────────────┐
│ [📎 Fotos] [⚡ Templates]              │
│ Escribe mensaje...           [Enviar]   │
│ ⏱ Ventana 24h: 9h 24m restantes       │
│ (o: ⛔ Solo templates disponibles)      │
└─────────────────────────────────────────┘
```

**Lógica de ventana 24h:**
- Query: último mensaje entrante del cliente (`sender_type='cliente'`, `comm_channel='cliente_c4'`, `servicio_id`)
- Si `created_at` < 24h → input libre habilitado + countdown pill
- Si > 24h o sin respuesta → input deshabilitado, solo botón "Enviar Template"

**Fuente de contactos:**
- `servicios_planificados.telefono_cliente` (contacto directo del servicio)
- `pc_clientes_contactos` WHERE `cliente_id` = cliente del servicio AND `activo = true`
- Deduplicar por últimos 10 dígitos

**Privacidad:** Cada contacto es 1:1. El monitorista ve todas las conversaciones consolidadas pero cada mensaje muestra claramente de/para quién es. Si envía a múltiples contactos, se genera 1 registro por contacto.

**Archivos:**
- **NUEVO:** `src/components/monitoring/bitacora/ClientChat.tsx`
- `ServiceCommSheet.tsx` (reemplazar ClientReportComposer por ClientChat, agregar tab 'Cliente' con badge de mensajes no leídos del cliente)
- `useServicioComm.ts` (agregar query para mensajes `cliente_c4` + cálculo de ventana 24h)
- **ELIMINAR:** `ClientReportComposer.tsx` (funcionalidad absorbida por ClientChat)

---

## Fase Dev 7 — Automatizaciones de ciclo de vida

Mensajes automáticos en momentos clave del servicio:

| Trigger | Template | Destinatarios | comm_channel |
|---|---|---|---|
| Planeación marca "En Sitio" | `posicionamiento_cliente` | Todos los contactos del cliente | `sistema` |
| C4 marca "Completado" | `cierre_servicio_cliente` | Todos los contactos del cliente | `sistema` |
| C4 marca "Completado" | `servicio_completado` | Custodio | `sistema` |

**Implementación:** Hooks en `useBitacoraBoard.ts` (completar servicio) y en el flujo de Planeación (marcar "En Sitio") que invoquen `kapso-send-template` con `comm_channel: 'sistema'`.

**Guard anti-duplicado:** Antes de enviar template automático, verificar que no exista ya un mensaje con el mismo `templateName + servicio_id + comm_channel='sistema'` en los últimos 5 minutos.

**Archivos:**
- `useBitacoraBoard.ts` (trigger al completar)
- Hook/componente de Planeación que marca "En Sitio" (trigger de posicionamiento)

---

## Fase Dev 8 — Broadcast multi-contacto para clientes

Cuando el monitorista envía un mensaje/template desde el tab Cliente:
- UI muestra checkboxes de contactos disponibles
- Por cada contacto seleccionado, se invoca `kapso-send-template` o `kapso-send-message` individualmente
- Cada envío genera su propio registro en `whatsapp_messages` con `chat_id` del contacto
- En la timeline, se agrupan visualmente: "Enviado a 2 contactos ✓✓"

**Archivos:** `ClientChat.tsx`

---

## Fase Dev 9 — Testing E2E y hardening

- Probar con `CommTestPanel` simulando flujos completos por canal
- Verificar routing: custodio pre-servicio vs en-servicio
- Verificar routing: cliente con servicio activo vs sin servicio
- Verificar handoff: bloqueo de escritura post-handoff
- Verificar ventana 24h: countdown correcto, bloqueo de input
- Edge case: custodio con 2 servicios simultáneos
- Edge case: cliente responde después de completar servicio
- Edge case: teléfono no registrado en ninguna tabla

---

## Mapa de riesgos y mitigaciones

```text
RIESGO                              MITIGACIÓN
──────────────────────────────      ─────────────────────────────────
Custodio con 2 servicios            Priorizar hora_inicio_real DESC;
simultáneos                         fallback a último msg saliente

Cliente responde >24h               Solo templates; UI lo indica
(fuera de ventana WA)               claramente con pill rojo

Planeación y C4 escriben            comm_channel separa; post-handoff
al custodio al mismo tiempo         Planeación es read-only

Teléfono del cliente no está        Matching fuzzy por últimos 10 dígitos
en pc_clientes                      en servicios_planificados.telefono_cliente

Template automático se               Guard anti-duplicado: verificar
envía 2 veces                       existencia en últimos 5 min

Contacto 1 no ve msgs de            Correcto por diseño (1:1); UI muestra
Contacto 2                          todas las conversaciones al monitorista

Webhook falla al clasificar         Default: comm_channel='unknown',
                                    cae a flujo de tickets existente
```

---

## Templates a registrar en Meta (acción externa)

| Template | Estado | Fase Dev |
|---|---|---|
| `posicionamiento_cliente` | Por crear | 7 |
| `cierre_servicio_cliente` | Por crear | 7 |
| `nudge_status_custodio` | No aprobado aún | Ya existe en código |
| `reporte_servicio_cliente` | No aprobado aún | Ya existe en código |
| `incidencia_servicio_cliente` | Por crear | 7 |

---

## Orden de implementación y dependencias

```text
Fase 1 (SQL)  ─────────────────────────────→  Sin dependencias
     │
Fase 2 (Webhook router) ──────────────────→  Depende de Fase 1
     │
Fase 3 (Edge functions salientes) ────────→  Depende de Fase 1
     │
Fase 4 (Chat Planeación) ────────────────→  Depende de Fases 2+3
     │
Fase 5 (Handoff + separadores) ──────────→  Depende de Fase 4
     │
Fase 6 (Tab Cliente bidireccional) ───────→  Depende de Fases 2+3
     │
Fase 7 (Automatizaciones) ───────────────→  Depende de Fases 5+6
     │
Fase 8 (Broadcast multi-contacto) ───────→  Depende de Fase 6
     │
Fase 9 (Testing E2E) ────────────────────→  Depende de todas
```

## Archivos totales impactados

| Archivo | Acción | Fases |
|---|---|---|
| Migración SQL | Crear | 1 |
| `kapso-webhook-receiver/index.ts` | Refactorizar | 2, 5 |
| `kapso-send-message/index.ts` | Modificar | 3, 5 |
| `kapso-send-template/index.ts` | Modificar | 3 |
| `useServicioComm.ts` | Modificar | 4, 6 |
| `ServiceCommSheet.tsx` | Modificar | 3, 6 |
| `CustodioChat.tsx` | Modificar | 5 |
| `ClientReportComposer.tsx` | Eliminar (reemplazar) | 6 |
| **`ClientChat.tsx`** | Crear | 6, 8 |
| **`PlanningCustodioComm.tsx`** | Crear | 4 |
| `CustodianAssignmentStep.tsx` | Modificar | 4 |
| `useBitacoraBoard.ts` | Modificar | 7 |
| `.lovable/plan.md` | Actualizar | Todas |

**Total: 9 fases, ~12 archivos, 3 edge functions a re-deployar, 3-5 templates a registrar en Meta.**

