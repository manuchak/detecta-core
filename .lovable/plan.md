

# Integración del Centro de Comunicaciones WhatsApp en la Bitácora

## Diagnóstico de compatibilidad

El UI actual de la Bitácora sigue un patrón consistente:
- **ServiceCards** compactas (3 filas: cliente+timer, custodio+ruta, folio+acciones)
- **ServiceDetailDrawer** como Sheet lateral derecho (380-420px) para auditoría
- **CheckpointPopover** para acciones rápidas inline
- **Interacciones**: single-click acciones, double-click detalle

La comunicación WhatsApp se integra en **dos puntos de contacto** sin romper nada:

## Estrategia de integración

```text
┌─ ServiceCardActive (existente) ──────────────────────┐
│ Row 1: Cliente          │                   45m      │
│ Row 2: Custodio · Ruta → Destino                     │
│ Row 3: Folio [Mon] [💬 2] ─nuevo─  [Reportar] [⋮]   │
│                  ↑                                    │
│         Badge con conteo de                           │
│         mensajes sin leer                             │
└──────────────────────────────────────────────────────┘
         │ click en 💬
         ▼
┌─ ServiceCommSheet (NUEVO — Sheet lateral) ───────────┐
│  ┌─ Tabs ──────────────────────────────────────────┐ │
│  │ [💬 Custodio]  [📋 Reportar a Cliente]          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Tab 1: Chat con custodio (iMessage-style)           │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 🟢 Custodio: "Llegando a punto de carga" 10:23 │ │
│  │ 📸 [foto inline]                         10:24  │ │
│  │ 🔵 Monitorista: "Recibido, gracias"      10:25  │ │
│  │                                                  │ │
│  │ ┌──────────────────┐ ┌──────────────────┐       │ │
│  │ │ 📸 Pedir Status  │ │ 💬 Msg libre     │       │ │
│  │ └──────────────────┘ └──────────────────┘       │ │
│  │ [  Escribe un mensaje...        ] [Enviar]      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Tab 2: Reportar a Cliente                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Fotos del custodio (seleccionar ☑):             │ │
│  │ [☑ foto1] [☑ foto2] [☐ foto3]                  │ │
│  │                                                  │ │
│  │ Template: reporte_servicio_cliente               │ │
│  │ Observaciones: [_______________]                 │ │
│  │ Destinatario: +52 55 1234 5678                  │ │
│  │                                                  │ │
│  │ [Enviar Reporte al Cliente]                     │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Por que es seamless

1. El 💬 se agrega como **un icono mas** en Row 3 del ServiceCardActive, junto al badge de monitorista y antes de "Reportar" — misma escala visual (h-6, text-[11px])
2. El CommSheet usa el **mismo componente Sheet** que ya usa ServiceDetailDrawer — misma animacion, mismo ancho, mismo patron de scroll
3. Las quick actions ("Pedir Status", "Msg libre") siguen el patron del **DropdownMenu** que ya existe en el menu de eventos especiales
4. Las fotos en el chat usan el mismo patron de thumbnails del **CheckpointPopover** (h-9 w-9 rounded)
5. Solo se agrega a **ServiceCardActive** y **ServiceCardEnDestino** (servicios donde hay comunicacion activa) — no a Pending ni Especial

## Fase 1 — Lo que construimos primero (solo frontend + DB)

### Base de datos (migración SQL)
- `ALTER TABLE whatsapp_messages ADD COLUMN servicio_id UUID REFERENCES servicios_planificados(id)`
- `ALTER TABLE whatsapp_messages ADD COLUMN is_read BOOLEAN DEFAULT false`
- Tabla `servicio_comm_media` (servicio_id, storage_path, media_type, validado, enviado_a_cliente)
- `ALTER TABLE pc_clientes ADD COLUMN contacto_whatsapp TEXT`
- Bucket `whatsapp-media` en Storage
- RLS con `has_monitoring_role()` / `has_monitoring_write_role()`

### Frontend — 4 componentes nuevos
| Componente | Descripcion |
|---|---|
| `ServiceCommSheet.tsx` | Sheet lateral con Tabs (Chat / Reportar), reutiliza Sheet existente |
| `CustodioChat.tsx` | Timeline iMessage-style con Realtime, input bar + quick actions |
| `ClientReportComposer.tsx` | Galeria de fotos seleccionables + template + envio |
| `useServicioComm.ts` | Hook: mensajes por servicio, Realtime subscription, conteo sin leer |

### Modificaciones a componentes existentes
| Archivo | Cambio |
|---|---|
| `ServiceCardActive.tsx` | Agregar boton 💬 con badge en Row 3 (entre monitorista badge y CheckpointPopover) |
| `ServiceCardEnDestino.tsx` | Agregar boton 💬 con badge antes del boton Liberar |
| `bitacora/index.ts` | Exportar nuevos componentes |

### Backend (Fase 2 — posterior)
- Actualizar `kapso-webhook-receiver` para vincular mensajes a servicio activo
- Nueva edge function `kapso-download-media` para persistir imagenes
- Nuevos templates en Meta Business Manager

## Archivos totales a crear/modificar

| Capa | Archivo | Accion |
|---|---|---|
| DB | Nueva migracion | Crear tabla, columnas, bucket, RLS |
| Frontend | `src/components/monitoring/bitacora/ServiceCommSheet.tsx` | Crear |
| Frontend | `src/components/monitoring/bitacora/CustodioChat.tsx` | Crear |
| Frontend | `src/components/monitoring/bitacora/ClientReportComposer.tsx` | Crear |
| Frontend | `src/hooks/useServicioComm.ts` | Crear |
| Frontend | `src/components/monitoring/bitacora/ServiceCardActive.tsx` | Modificar (agregar 💬) |
| Frontend | `src/components/monitoring/bitacora/ServiceCardEnDestino.tsx` | Modificar (agregar 💬) |
| Frontend | `src/components/monitoring/bitacora/index.ts` | Modificar (exports) |

