# Plan Maestro: Comunicación WhatsApp Multi-Fase — Número Único

## Resumen ejecutivo
Integrar routing multi-canal + gestión de clientes en 9 fases de desarrollo.
Sistema completo de 4 canales lógicos con routing inteligente, handoff Planeación → C4, y chat bidireccional con clientes.

## Fase Dev 1 — Modelo de datos ✅
- ✅ `comm_channel` TEXT (custodio_planeacion | custodio_c4 | cliente_c4 | sistema | unknown)
- ✅ `comm_phase` TEXT (pre_servicio | en_servicio | post_servicio | sin_servicio)
- ✅ `sender_type` TEXT (custodio | cliente | staff | sistema | unknown)
- ✅ Índice compuesto `idx_wm_servicio_channel` (servicio_id, comm_channel)
- ✅ Índice `idx_wm_channel_sender` para queries de cliente
- ✅ Backfill de registros existentes

## Fase Dev 2 — Router de contexto en webhook ✅
- ✅ `resolveMessageContext()` clasifica sender como custodio/cliente/unknown
- ✅ Priorización: servicio en monitoreo > servicio pre-servicio > herencia de último saliente
- ✅ Lookup en: profiles (custodio), servicios_planificados.telefono_cliente, pc_clientes_contactos, pc_clientes.contacto_whatsapp
- ✅ Registra comm_channel, comm_phase, sender_type en cada insert
- ✅ Cliente con servicio activo → visible en tab, no crea ticket
- ✅ Cliente sin servicio → crea ticket de atención

## Fase Dev 3 — Clasificación en mensajes salientes ✅
- ✅ `kapso-send-message`: acepta context.comm_channel, registra sender_type='staff'
- ✅ `kapso-send-template`: acepta context.comm_channel, registra sender_type='staff'
- ✅ `useServicioComm`: soporta filtro opcional `commChannel`
- ✅ `CommMessage` interface incluye comm_channel, comm_phase, sender_type

## Fase Dev 4 — Chat de Planeación con custodio ✅
- ✅ NUEVO: `PlanningCustodioComm.tsx` con burbujas, quick actions, input
- ✅ Filtra por `comm_channel='custodio_planeacion'`
- ✅ Read-only después del handoff (`isHandedOff` prop)
- ✅ Acciones rápidas: "¿En posición?", "Pedir foto", "Recibido"
- ✅ Pendiente: integrar en `CustodianAssignmentStep` (requiere refactor del flujo de asignación)

## Fase Dev 5 — Handoff Planeación → C4 ✅
- ✅ Mensaje de sistema insertado en `whatsapp_messages` al marcar "En Sitio" (comm_channel='sistema', sender_type='sistema')
- ✅ Separador visual amber en `CustodioChat.tsx` para mensajes con sender_type='sistema' y texto "transferido"
- ✅ `PlanningCustodioComm` integrado en `CompactServiceCard` via Sheet lateral con botón MessageCircle + badge unread
- ✅ RPC `get_real_planned_services_summary` actualizado para incluir `custodio_telefono`

## Fase Dev 6 — Tab Cliente bidireccional ✅
- ✅ NUEVO: `ClientChat.tsx` — chat bidireccional con ventana 24h
- ✅ Selector de contacto: `telefono_cliente` + `pc_clientes_contactos`
- ✅ WindowPill con countdown en tiempo real
- ✅ Input deshabilitado cuando ventana cerrada, solo templates
- ✅ Burbujas diferenciadas cliente (verde) vs staff (azul)
- ✅ `ServiceCommSheet` actualizado: tab "Cliente" con badge de unread
- ✅ Pasa `comm_channel` en context de nudge y mensajes salientes

## Fase Dev 7 — Automatizaciones de ciclo de vida ✅
- ✅ `sendLifecycleTemplate()` utility con guard anti-duplicado 5 min
- ✅ `sendPositioningNotification()` — auto-envío `posicionamiento_cliente` al marcar "En Sitio"
- ✅ `sendCompletionNotifications()` — auto-envío `cierre_servicio_cliente` + `servicio_completado` al liberar custodio
- ✅ Resolución automática de contactos del cliente (telefono_cliente + pc_clientes_contactos)
- ✅ Fire-and-forget: no bloquea el flujo principal

## Fase Dev 8 — Broadcast multi-contacto ✅
- ✅ Checkboxes multi-selección con "Todos/Ninguno" en tab Cliente
- ✅ Envío individual por contacto via `Promise.allSettled` con toast resumen (ok/fail)
- ✅ Agrupación visual: mensajes broadcast (mismo texto, ±5s) se muestran como una sola burbuja con badge "Enviado a N contactos"
- ✅ Placeholder dinámico refleja cantidad de contactos seleccionados
- ✅ Badge en composer muestra "N dest." cuando hay múltiples seleccionados

## Fase Dev 9 — Testing E2E + Switch WhatsApp ✅
- ✅ Tabla `app_feature_flags` con RLS (read: authenticated, write: admin/owner/coordinador)
- ✅ Seeds: `whatsapp_planeacion` (OFF), `whatsapp_monitoreo` (OFF)
- ✅ Realtime habilitado en `app_feature_flags`
- ✅ Hook `useWhatsAppMode` con react-query + realtime subscription
- ✅ Switches "WA Plan" y "WA Mon" en `CoordinatorCommandCenter` header
- ✅ `CompactServiceCard`: botón chat condicionado a flag `whatsapp_planeacion`
- ✅ `ServiceCommSheet`: placeholder "WhatsApp deshabilitado" cuando flag `whatsapp_monitoreo` está OFF
- ✅ `CommScenarioSimulator` con 3 escenarios guiados (Planeación, Monitoreo, Cliente)
- ✅ Cada escenario: pasos individuales + "Ejecutar Todo" con barra de progreso
- ✅ Verificaciones de persistencia y comm_channel en cada escenario

## Dependencias
```
Fase 1 → Fase 2, Fase 3 (paralelas)
Fase 2+3 → Fase 4, Fase 6 (paralelas)
Fase 4 → Fase 5
Fase 5+6 → Fase 7
Fase 6 → Fase 8
Todas → Fase 9
```

## Templates Meta pendientes
| Template | Estado |
|---|---|
| posicionamiento_cliente | Por crear |
| cierre_servicio_cliente | Por crear |
| incidencia_servicio_cliente | Por crear |
| nudge_status_custodio | No aprobado aún |
| reporte_servicio_cliente | No aprobado aún |

# Auditoría Proveedores Externos y P&L Gadgets

## Fase 1 — Base de Datos ✅
- ✅ Tabla `inventario_gadgets` (serial, tipo, proveedor, renta_mensual, estado)
- ✅ Tabla `rentas_gadgets_mensuales` (mes, unidades, renta/unidad, total, factura)
- ✅ Tabla `conciliacion_proveedor_armados` (cxp_id, archivo, mapeo, conteos, estado)
- ✅ Tabla `conciliacion_detalle` (asignacion_id, fila_proveedor, resultado, resolución)
- ✅ ALTER `proveedores_armados` ADD `frecuencia_pago`
- ✅ RLS con `has_facturacion_role()` / `has_facturacion_write_role()`
- ✅ Índices optimizados

## Fase 2 — Inventario Gadgets + P&L ✅
- ✅ Hook `useInventarioGadgets` (CRUD inventario, rentas, P&L calculation)
- ✅ `InventarioGadgetsPanel` — tabla con filtros, CRUD dialog, KPIs
- ✅ `RentasGadgetsPanel` — registro mensual de rentas con auto-cálculo
- ✅ `GadgetsPnLPanel` — dashboard ingresos vs egresos con margen
- ✅ `GadgetsTab` — segmented control integrado en EgresosTab
- ✅ Integración en `EgresosTab` como cuarto segmento "Gadgets & P&L"

## Fase 3 — Conciliación Proveedores ✅
- ✅ Upload + parser Excel/CSV (`conciliacionParserService.ts`)
- ✅ Mapeo de columnas asistido con auto-detección
- ✅ Motor de conciliación fuzzy (Dice coefficient: fecha 40% + nombre 40% + ruta 20%)
- ✅ `ConciliacionDialog` — flujo 3 pasos: upload → mapeo → resultados
- ✅ `ConciliacionDetalleSheet` — resolución línea a línea (aceptar/rechazar/ajustar)
- ✅ Hook `useConciliacion` con CRUD completo
- ✅ Integración en `CxPProveedoresTab` con botones "Conciliar" y "Ver detalle"

## Fase 4 — Cortes Flexibles (Pendiente)
- Adaptar generación de cortes a semanal/mensual por proveedor
- UI de frecuencia en configuración de proveedor
