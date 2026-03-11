

# Análisis de la Prueba de Template + Fix del Webhook Receiver

## Hallazgos del Análisis

La prueba reveló **dos problemas críticos**:

### 1. El webhook FUNCIONA pero el receiver NO parsea el formato de Kapso

Los logs muestran que Kapso envió **2 eventos** para el template `confirmacion_posicionamiento`:

```text
Evento 1: status = "sent"     → "Evento no manejado: undefined"
Evento 2: status = "failed"   → "Evento no manejado: undefined"
```

**Causa raíz:** El receiver espera `payload.event` (ej: `"whatsapp.message.delivered"`), pero Kapso envía un formato diferente sin campo `event`. El status viene en `message.kapso.status`:

```text
ESPERADO:                          RECIBIDO DE KAPSO:
{                                  {
  "event": "whatsapp.message..."     "message": {
  "data": { "id": "..." }             "id": "wamid...",
}                                      "kapso": {
                                         "direction": "outbound",
                                         "status": "failed",  ← AQUÍ
                                         "statuses": [...]
                                       }
                                     },
                                     "conversation": {...}
                                   }
```

### 2. El template FALLÓ por problema de pago en Meta

El status final fue `failed` con error:

```text
Code:    131042
Title:   "Business eligibility payment issue"
Detail:  "Message failed to send because there were one or more errors
          related to your payment method."
```

Esto es un problema de configuración de la cuenta de WhatsApp Business en Meta — el método de pago asociado tiene un problema. **Esto NO es un bug de código.**

## Plan de Corrección

Adaptar `kapso-webhook-receiver` para parsear el formato real de Kapso además del formato genérico actual.

### Cambios en `supabase/functions/kapso-webhook-receiver/index.ts`:

Agregar detección del formato Kapso al inicio del handler POST:

```typescript
// Detectar formato Kapso (sin campo "event" top-level)
if (!payload.event && payload.message?.kapso) {
  const kapsoStatus = payload.message.kapso.status; // sent|delivered|read|failed
  const messageId = payload.message.id;
  const direction = payload.message.kapso.direction; // inbound|outbound

  if (direction === 'outbound') {
    // Actualizar delivery_status del mensaje saliente
    await handleDeliveryStatus(supabase, { data: { id: messageId, status: kapsoStatus } }, kapsoStatus);
    
    // Si failed, loguear errores detallados
    if (kapsoStatus === 'failed' && payload.message.kapso.statuses?.[0]?.errors) {
      console.error('❌ Error de entrega:', JSON.stringify(payload.message.kapso.statuses[0].errors));
    }
  } else if (direction === 'inbound') {
    // Convertir a formato interno y procesar como mensaje entrante
    await handleIncomingMessage(supabase, adaptedPayload);
  }
  return response;
}
```

### Archivos a modificar:

| Archivo | Cambio |
|---|---|
| `supabase/functions/kapso-webhook-receiver/index.ts` | Agregar parsing del formato real de Kapso antes del switch existente |

### Resumen visual del fix:

```text
ANTES:                              DESPUÉS:
payload.event → switch              payload.event? → switch (formato genérico)
  └─ undefined → "no manejado" ❌    payload.message.kapso? → parse status ✅
                                       └─ outbound → handleDeliveryStatus
                                       └─ inbound → handleIncomingMessage
                                       └─ failed → log errors detallados
```

### Acción requerida fuera de código:
Resolver el error **131042** en el Business Manager de Meta (Settings → Payment Methods) — sin esto, ningún template será entregado aunque el código esté perfecto.

