# Centro de Comunicaciones WhatsApp — Bitácora

## Estado: Fase 1 completada ✅

### DB (migración aplicada)
- ✅ `whatsapp_messages`: columnas `servicio_id` (FK) e `is_read` agregadas con índices
- ✅ `servicio_comm_media`: tabla creada con RLS (`has_monitoring_role` / `has_monitoring_write_role`)
- ✅ `pc_clientes`: columna `contacto_whatsapp` agregada
- ✅ Bucket `whatsapp-media` creado (público, RLS para upload)
- ✅ Realtime habilitado en `servicio_comm_media`

### Frontend (creado)
- ✅ `useServicioComm.ts` — hook con mensajes por servicio, Realtime, conteo sin leer
- ✅ `ServiceCommSheet.tsx` — Sheet lateral con Tabs (Chat / Reportar)
- ✅ `CustodioChat.tsx` — Timeline iMessage-style con quick actions
- ✅ `ClientReportComposer.tsx` — Galería de fotos + template + envío
- ✅ `ServiceCardActive.tsx` — Botón 💬 con badge de mensajes sin leer
- ✅ `ServiceCardEnDestino.tsx` — Botón 💬 con badge de mensajes sin leer

## Fase 2 — Backend (pendiente parcial)
- Actualizar `kapso-webhook-receiver` para vincular mensajes a servicio activo del custodio
- Crear edge function `kapso-download-media` (Kapso Media API → Supabase Storage)
- Registrar templates en Meta: `nudge_status_custodio`, `reporte_servicio_cliente`, `cierre_servicio_cliente`

## Fase 2.5 — Trazabilidad monitorista ✅
- ✅ `whatsapp_messages.sent_by_user_id` — columna UUID con FK a auth.users
- ✅ Edge functions `kapso-send-message` y `kapso-send-template` registran `sent_by_user_id`
- ✅ `ServiceCommSheet` envía `user.id` al invocar edge functions
- ✅ `useServicioComm` resuelve `display_name` desde `profiles`
- ✅ `CustodioChat` muestra nombre del monitorista en burbujas y separadores de handoff

## Fase 2.6 — Debug E2E Comunicación ✅
- ✅ Bug 1: Nombres de campo corregidos (`phone`→`to`, `template_name`→`templateName`, `language_code`→`languageCode`, `message`→`text`, agregado `type:'text'`)
- ✅ Bug 2: Se usa `service.custodio_telefono` en lugar de `service.custodio_asignado` como número de teléfono
- ✅ Bug 3: `BoardService` ahora incluye `custodio_telefono` y `telefono_cliente` en la query e interfaz
- ✅ Bug 4: Edge functions insertan `servicio_id` desde `context.servicio_id` en `whatsapp_messages`
- ✅ Bug 5: Formato de `components` corregido de array a objeto `{ body: { parameters: [...] } }`
- ✅ Bug 6: `telefono_cliente` se pasa a `ClientReportComposer` como `contactoWhatsapp`
- ✅ Bug 7: Se pasa `service.id` (UUID) como `servicio_id` en context
- ✅ Validación: guard de teléfono antes de enviar nudge o mensaje libre

## Fase 3 — Blindaje Workflow Planeación → Monitoreo ✅

### Gate de Visibilidad (Q1)
- ✅ `useBitacoraBoard.ts` — pendingQuery ahora filtra `.not('hora_llegada_custodio', 'is', null)` 
- ✅ Monitoreo SOLO ve servicios donde Planeación confirmó "En Sitio"

### Guard de Inicio
- ✅ `iniciarServicio` verifica `hora_llegada_custodio IS NOT NULL` antes de escribir `hora_inicio_real`
- ✅ Toast de error explícito si custodio no ha sido marcado "En Sitio"

### Protección de Asignaciones Manuales (OrphanGuard Rule 4)
- ✅ `useOrphanGuard.ts` — Rule 4 excluye asignaciones con `asignado_por != null` (coordinador)
- ✅ Solo limpia asignaciones automáticas >4h en el futuro

### Supresión de Alertas en Pernocta
- ✅ `computePhaseAndTimers` no escala `alertLevel` cuando evento activo es `pernocta`

### Contador Total por Monitorista
- ✅ `BitacoraBoard.tsx` — Badge desglosado: `N pendientes · M en curso · K evento = T total`
- ✅ `MonitoristaCard.tsx` — Badge `(NP · MC · KE)` por fase
- ✅ `CoordinatorCommandCenter.tsx` — Calcula `phaseBreakdownByMonitorista` y lo pasa a cards

## Fase 4 — Escalamiento y métricas (pendiente)
- Auto-escalamiento si custodio no responde a nudge en 15/30 min
- Dashboard de métricas de comunicación
- Bulk nudge para todos los custodios activos
