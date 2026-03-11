

# Panel de Pruebas Comm -- Ampliado con Simulación de Conversaciones

## Respuesta corta

El plan original solo cubría **envío**. Pero si, podemos ampliarlo para también **simular recepción** y conversaciones bidireccionales completas. La clave es que el webhook de Kapso (`kapso-webhook-receiver`) inserta mensajes con `is_from_bot: false` en `whatsapp_messages`. Podemos replicar esa inserción directamente desde el panel de pruebas sin necesidad del webhook real.

## Plan ampliado

### Secciones del `CommTestPanel.tsx`

**1. Configuración de destino** (sin cambios)
- Input de teléfono + botón "Usar mi número"

**2. Envío de mensaje libre** (sin cambios)
- Tipo text/image/document → invoca `kapso-send-message`

**3. Envío de template** (sin cambios)
- Selector de templates → invoca `kapso-send-template`

**4. Simulador de mensaje entrante** (NUEVO)
- Inserta directamente en `whatsapp_messages` con `is_from_bot: false`, simulando lo que haría el webhook cuando un custodio responde
- Campos: texto del mensaje, tipo (text/image/location), media_url opcional
- Opción de vincular a un `servicio_id` (selector de servicios activos) para que el mensaje aparezca en el chat de ese servicio
- El mensaje se inserta con `chat_id` = número del custodio simulado, lo que dispara el realtime subscription en `CustodioChat`

**5. Simulador de conversación** (NUEVO)
- Vista de chat en tiempo real que muestra todos los mensajes del número destino (query por `chat_id`)
- Permite alternar entre "enviar como monitorista" (edge function real) y "simular respuesta custodio" (insert directo)
- Verifica visualmente: burbujas azules (bot) vs grises (custodio), autoría del monitorista, separadores de handoff

**6. Verificación de persistencia** (sin cambios)
- Tabla con últimos 20 registros filtrados por número, mostrando todos los campos críticos

### Integración

- Nueva tab `comm-test` en `MonitoringPage.tsx` con icono `FlaskConical`, visible solo para coordinadores/admin
- Un solo componente `CommTestPanel.tsx` con sub-tabs internas (Envío | Recepción | Conversación | Persistencia)

### Archivos

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/comm/CommTestPanel.tsx` | Nuevo |
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar tab |

### Detalle: Insert directo para simular recepción

```text
whatsapp_messages INSERT:
  chat_id:          → número simulado
  message_text:     → texto del tester
  message_type:     → 'text' | 'image'
  is_from_bot:      → false
  is_read:          → false
  delivery_status:  → 'delivered'
  servicio_id:      → UUID del servicio (opcional)
  sent_by_user_id:  → null (es "custodio")
  media_url:        → URL opcional
```

Esto dispara el canal realtime `comm-{servicioId}` y el mensaje aparece instantáneamente en el `CustodioChat` del servicio, validando el flujo completo de recepción + UI + realtime.

