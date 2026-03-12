

# QA Checklist WhatsApp — Nuevo tab en CommTestPanel

## Alcance
Checklist exclusivamente para pruebas de comunicación WhatsApp, organizado por las áreas del CommTestPanel existente.

## Implementación

### 1. Crear `src/components/monitoring/comm/QAChecklistPanel.tsx`

Componente con checklist persistido en `localStorage` (`qa-checklist-whatsapp`). Secciones colapsables con progreso por sección:

**Sección 1: Envío de Mensajes (5 tests)**
- Envío de texto libre a número válido
- Envío de imagen con caption
- Envío de documento
- Normalización de teléfono (formato 52+10 dígitos)
- Error controlado sin teléfono configurado

**Sección 2: Templates (4 tests)**
- Carga de templates aprobados desde DB
- Envío de template con variables
- Payload correcto (languageCode, components)
- Template sin variables (variable_count=0)

**Sección 3: Recepción / Simulación Inbound (3 tests)**
- Mensaje inbound se persiste con is_from_bot=false
- Media inbound con URL renderizable
- Asociación correcta a servicio_id

**Sección 4: Conversación Multi-Canal (6 tests)**
- Canal custodio_planeacion: mensajes pre-servicio
- Canal custodio_c4: mensajes monitoreo activo
- Canal cliente_c4: chat bidireccional
- Handoff planeacion→c4 inserta mensaje sistema
- Post-handoff: planeación queda read-only
- Filtrado por comm_channel funciona

**Sección 5: Broadcast (3 tests)**
- Envío a múltiples contactos
- Agrupación en burbuja con BroadcastBadge (ventana 5s)
- Resumen de éxitos/fallos por destinatario

**Sección 6: Persistencia y DB (4 tests)**
- Mensajes persisten en whatsapp_messages con columnas correctas
- delivery_status correcto (sent/received)
- sender_type correcto por contexto
- Realtime subscription actualiza mensajes nuevos

**Sección 7: Feature Flags / Gobernanza (3 tests)**
- Flag planeación deshabilitado oculta chat en Planning
- Flag monitoreo deshabilitado oculta chat en Monitoring
- Flags se controlan desde Centro de Coordinación

**Sección 8: Escenarios E2E (3 tests)**
- Escenario Planeación completo (6 pasos)
- Escenario Monitoreo completo (5 pasos)
- Escenario Cliente completo (4 pasos)

**Total: 31 tests**

Cada item: checkbox, descripción, selector pass/fail/skip, timestamp al marcar. Barra de progreso global con color coding. Botones: Resetear todo, Exportar JSON.

### 2. Modificar `CommTestPanel.tsx`
- Agregar tab "QA Checklist" con icono `ClipboardCheck` después de "Escenarios"
- Import del nuevo componente

### Archivos
1. **Crear** `src/components/monitoring/comm/QAChecklistPanel.tsx`
2. **Modificar** `src/components/monitoring/comm/CommTestPanel.tsx` — agregar tab

