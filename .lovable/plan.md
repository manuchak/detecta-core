

# Fase Dev 5 — Handoff Planeación → C4

## Alcance

Tres entregables que completan la transferencia de comunicación entre Planeación y Monitoreo:

### 1. Mensaje de sistema al marcar "En Sitio"

Cuando Planeación registra `hora_llegada_custodio`, insertar automáticamente un mensaje en `whatsapp_messages`:

```
message_text: "🔄 Servicio transferido a Monitoreo (C4)"
comm_channel: 'sistema'
comm_phase: 'en_servicio'  
sender_type: 'sistema'
is_from_bot: true
servicio_id: <UUID>
```

**Archivo**: `src/hooks/useStatusUpdate.ts` (o donde se ejecute el UPDATE de `hora_llegada_custodio`) — agregar insert después del update exitoso.

### 2. Separador visual de handoff en CustodioChat (Monitoreo)

En `src/components/monitoring/bitacora/CustodioChat.tsx`, detectar mensajes con `sender_type === 'sistema'` y `message_text` que contenga "transferido" para renderizar un separador visual (similar al `HandoffSeparator` que ya existe para cambios de sender) en lugar de una burbuja normal.

**Archivo**: `src/components/monitoring/bitacora/CustodioChat.tsx` — modificar el render loop para filtrar mensajes de sistema como separadores.

### 3. Integrar PlanningCustodioComm en el flujo de Planeación

El componente ya existe y funciona. Falta montarlo en la UI de Planeación para que el equipo pueda comunicarse con el custodio pre-servicio. Necesito explorar dónde se muestra el detalle/asignación de un servicio en Planeación para decidir el punto de montaje exacto.

**Archivos candidatos**: Explorar `CompactServiceCard.tsx`, modales de detalle de servicio, o el paso de asignación del wizard.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Hook de status update (por identificar) | Insert mensaje sistema al marcar En Sitio |
| `CustodioChat.tsx` | Separador visual para mensajes de sistema/handoff |
| Componente de detalle/asignación en Planeación | Montar `PlanningCustodioComm` |

