
# Plan de Integración Completa de Kapso WhatsApp en Detecta

## Resumen Ejecutivo

Este plan detalla la integración de Kapso como la plataforma oficial de comunicación WhatsApp para Detecta, reemplazando el sistema actual basado en Baileys (librería no oficial que no funciona) y los enlaces manuales `wa.me`. La integración habilitará comunicación bidireccional real, automatización de notificaciones y soporte en tiempo real.

---

## Análisis del Estado Actual

### Sistema WhatsApp Existente (Problemático)

**1. Implementación Actual con Baileys:**
- Edge function `whatsapp-bot/index.ts` intenta usar Baileys
- Solo genera QR codes de demostración (no funcionales)
- Los mensajes se envían en "modo demo" sin entrega real
- No hay comunicación bidireccional

**2. Envíos Manuales via wa.me (10 lugares identificados):**

| Ubicación | Caso de Uso | Archivo |
|-----------|-------------|---------|
| Invitaciones de custodios | Envío de link de registro | `InvitationActionsDropdown.tsx` |
| Asignación de servicios | Contacto inicial | `PendingAssignmentModal.tsx` |
| Reasignación | Notificar cambio | `ReassignmentModal.tsx` |
| Liberación de custodios | Envío de credenciales | `LiberacionSuccessModal.tsx` |
| Recordatorio de checklist | Pre-servicio | `ChecklistDetailModal.tsx` |
| Alertas de checklist | Urgentes | `ChecklistAlertPanel.tsx` |
| Contacto directo | Desde perfiles | `CustodiosDataTable.tsx` |
| Envío SIERCP | Evaluaciones | `SendSIERCPDialog.tsx` |
| Asignación custodio | Confirmación | `SelectedCustodianSummary.tsx` |
| Invitaciones masivas | Bulk | `BulkInvitationWizard.tsx` |

**3. Infraestructura de Base de Datos Existente:**

```
whatsapp_configurations  - Configuración general del bot
whatsapp_sessions       - Sesiones activas (no funcional)
whatsapp_messages       - Historial de mensajes
whatsapp_templates      - Plantillas predefinidas
whatsapp_connection_logs - Logs de conexión
tickets.whatsapp_chat_id - Vínculo ticket-conversación
```

---

## Arquitectura de Integración Kapso

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DETECTA FRONTEND                             │
├─────────────────────────────────────────────────────────────────────┤
│  Components que disparan notificaciones:                             │
│  - PendingAssignmentModal → kapso-send-message                      │
│  - LiberacionSuccessModal → kapso-send-template                     │
│  - ChecklistAlertPanel → kapso-send-message                         │
│  - TicketsList → kapso-send-message (respuestas)                    │
│  - Settings/WhatsAppManager → kapso-config (actualizado)            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────────┐               │
│  │ kapso-send-message  │  │ kapso-send-template     │               │
│  │ • Mensajes de texto │  │ • Templates aprobados   │               │
│  │ • Imágenes/docs     │  │ • Notificaciones        │               │
│  │ • Botones interac.  │  │ • Confirmaciones        │               │
│  │ • Ubicaciones       │  │ • Alertas               │               │
│  └─────────┬───────────┘  └───────────┬─────────────┘               │
│            │                          │                              │
│            └──────────┬───────────────┘                              │
│                       ▼                                              │
│  ┌───────────────────────────────────────────────────────┐          │
│  │                   Kapso API Layer                      │          │
│  │  @kapso/whatsapp-cloud-api (npm:@kapso/...)           │          │
│  │  Base URL: https://api.kapso.ai/meta/whatsapp         │          │
│  └───────────────────────────────────────────────────────┘          │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │               kapso-webhook-receiver                         │    │
│  │  Eventos:                                                    │    │
│  │  • whatsapp.message.received → Crear/actualizar tickets     │    │
│  │  • whatsapp.message.delivered → Actualizar status           │    │
│  │  • whatsapp.message.read → Marcar como leído                │    │
│  │  • Interactive button clicks → Procesar respuestas          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         KAPSO PLATFORM                               │
├─────────────────────────────────────────────────────────────────────┤
│  • API oficial de WhatsApp Cloud                                     │
│  • Webhooks estructurados                                            │
│  • Gestión de templates                                              │
│  • Historial de conversaciones                                       │
│  • Phone Number ID: [Configurar en dashboard]                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Configuración Base y Secretos

### 1.1 Almacenamiento del API Key de Kapso

**Acción:** Agregar secret `KAPSO_API_KEY` a Supabase

**Ubicación del secret:** Supabase Dashboard → Settings → Secrets

**Uso en edge functions:**
```typescript
const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY');
if (!KAPSO_API_KEY) {
  throw new Error('KAPSO_API_KEY no configurado');
}
```

### 1.2 Configuración Adicional Requerida

**Secrets adicionales a configurar:**
- `KAPSO_PHONE_NUMBER_ID` - ID del número de WhatsApp Business en Kapso
- `KAPSO_WEBHOOK_SECRET` - Para validar webhooks entrantes (opcional pero recomendado)

### 1.3 Actualizar Tabla de Configuración

**Migración SQL para extender whatsapp_configurations:**

```sql
-- Agregar campos para Kapso
ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  kapso_phone_number_id TEXT;

ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  kapso_waba_id TEXT;

ALTER TABLE whatsapp_configurations ADD COLUMN IF NOT EXISTS 
  integration_type TEXT DEFAULT 'kapso' 
  CHECK (integration_type IN ('kapso', 'legacy_baileys'));

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_type 
  ON whatsapp_configurations(integration_type);
```

---

## Fase 2: Edge Functions para Comunicación Saliente

### 2.1 Edge Function: `kapso-send-message`

**Propósito:** Enviar mensajes de texto, imágenes, documentos y mensajes interactivos

**Archivo:** `supabase/functions/kapso-send-message/index.ts`

**Estructura completa:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp';

interface SendMessageRequest {
  to: string;                    // Número de teléfono (con código país)
  type: 'text' | 'image' | 'document' | 'template' | 'interactive';
  
  // Para mensajes de texto
  text?: string;
  
  // Para imágenes/documentos
  mediaUrl?: string;
  mediaCaption?: string;
  filename?: string;
  
  // Para mensajes interactivos
  interactive?: {
    type: 'button' | 'list';
    header?: string;
    body: string;
    footer?: string;
    buttons?: Array<{
      id: string;
      title: string;
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
  
  // Contexto para tracking
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY');
    const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID');
    
    if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
      throw new Error('Configuración de Kapso incompleta');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: SendMessageRequest = await req.json();
    
    // Normalizar número de teléfono (formato internacional)
    const normalizedPhone = normalizePhoneNumber(request.to);
    
    let messagePayload: any;
    let endpoint = `${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`;
    
    // Construir payload según tipo de mensaje
    switch (request.type) {
      case 'text':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: { body: request.text }
        };
        break;
        
      case 'image':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'image',
          image: {
            link: request.mediaUrl,
            caption: request.mediaCaption
          }
        };
        break;
        
      case 'document':
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'document',
          document: {
            link: request.mediaUrl,
            filename: request.filename,
            caption: request.mediaCaption
          }
        };
        break;
        
      case 'interactive':
        messagePayload = buildInteractivePayload(normalizedPhone, request.interactive!);
        break;
        
      default:
        throw new Error(`Tipo de mensaje no soportado: ${request.type}`);
    }
    
    // Enviar a Kapso
    console.log('Enviando mensaje a Kapso:', JSON.stringify(messagePayload, null, 2));
    
    const kapsoResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KAPSO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });
    
    const kapsoData = await kapsoResponse.json();
    
    if (!kapsoResponse.ok) {
      console.error('Error de Kapso:', kapsoData);
      throw new Error(kapsoData.error?.message || 'Error al enviar mensaje');
    }
    
    // Registrar mensaje en base de datos
    const messageRecord = {
      chat_id: normalizedPhone,
      message_id: kapsoData.messages?.[0]?.id,
      sender_phone: KAPSO_PHONE_NUMBER_ID,
      message_text: request.text || request.mediaCaption || '[Mensaje interactivo]',
      message_type: request.type,
      media_url: request.mediaUrl,
      is_from_bot: true,
      ticket_id: request.context?.ticket_id || null,
      created_at: new Date().toISOString()
    };
    
    await supabase.from('whatsapp_messages').insert(messageRecord);
    
    // Log de auditoría
    console.log(`Mensaje enviado exitosamente a ${normalizedPhone}. ID: ${kapsoData.messages?.[0]?.id}`);
    
    return new Response(JSON.stringify({
      success: true,
      message_id: kapsoData.messages?.[0]?.id,
      to: normalizedPhone
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error en kapso-send-message:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function normalizePhoneNumber(phone: string): string {
  // Eliminar espacios, guiones, paréntesis
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Si no tiene código de país, agregar +52 (México)
  if (!cleaned.startsWith('+') && !cleaned.startsWith('52')) {
    cleaned = '52' + cleaned;
  }
  
  // Eliminar el + si existe
  cleaned = cleaned.replace(/^\+/, '');
  
  return cleaned;
}

function buildInteractivePayload(to: string, interactive: any) {
  if (interactive.type === 'button') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
        body: { text: interactive.body },
        footer: interactive.footer ? { text: interactive.footer } : undefined,
        action: {
          buttons: interactive.buttons.map((btn: any, index: number) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20) // WhatsApp limita a 20 chars
            }
          }))
        }
      }
    };
  } else if (interactive.type === 'list') {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: interactive.header ? { type: 'text', text: interactive.header } : undefined,
        body: { text: interactive.body },
        footer: interactive.footer ? { text: interactive.footer } : undefined,
        action: {
          button: 'Ver opciones',
          sections: interactive.sections
        }
      }
    };
  }
  
  throw new Error('Tipo interactivo no soportado');
}
```

### 2.2 Edge Function: `kapso-send-template`

**Propósito:** Enviar templates aprobados por WhatsApp (necesarios para iniciar conversaciones fuera de ventana de 24h)

**Archivo:** `supabase/functions/kapso-send-template/index.ts`

**Estructura completa:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp';

interface SendTemplateRequest {
  to: string;
  templateName: string;
  languageCode?: string;  // Default: 'es_MX'
  
  // Componentes del template
  components?: {
    header?: {
      type: 'text' | 'image' | 'document' | 'video';
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video';
        text?: string;
        image?: { link: string };
        document?: { link: string; filename: string };
      }>;
    };
    body?: {
      parameters: Array<{
        type: 'text';
        text: string;
      }>;
    };
    buttons?: Array<{
      type: 'quick_reply' | 'url';
      index: number;
      parameters?: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
  
  // Contexto para tracking
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
    invitation_id?: string;
  };
}

// Templates predefinidos para Detecta
const DETECTA_TEMPLATES = {
  // Invitación de custodio
  custodio_invitacion: {
    name: 'custodio_invitacion',
    language: 'es_MX',
    bodyParams: ['nombre', 'link']
  },
  
  // Asignación de servicio
  servicio_asignado: {
    name: 'servicio_asignado',
    language: 'es_MX',
    bodyParams: ['custodio_nombre', 'cliente', 'fecha', 'hora', 'origen']
  },
  
  // Recordatorio de servicio
  recordatorio_servicio: {
    name: 'recordatorio_servicio',
    language: 'es_MX',
    bodyParams: ['custodio_nombre', 'minutos', 'cliente', 'origen']
  },
  
  // Alerta de checklist
  alerta_checklist: {
    name: 'alerta_checklist',
    language: 'es_MX',
    bodyParams: ['custodio_nombre', 'servicio_id']
  },
  
  // Confirmación de posicionamiento
  confirmacion_posicion: {
    name: 'confirmacion_posicion',
    language: 'es_MX',
    bodyParams: ['custodio_nombre', 'hora', 'ubicacion']
  },
  
  // Ticket actualizado
  ticket_actualizado: {
    name: 'ticket_actualizado',
    language: 'es_MX',
    bodyParams: ['ticket_numero', 'status', 'mensaje']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY');
    const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID');
    
    if (!KAPSO_API_KEY || !KAPSO_PHONE_NUMBER_ID) {
      throw new Error('Configuración de Kapso incompleta');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: SendTemplateRequest = await req.json();
    
    const normalizedPhone = request.to.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
    const languageCode = request.languageCode || 'es_MX';
    
    // Construir payload del template
    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedPhone,
      type: 'template',
      template: {
        name: request.templateName,
        language: {
          code: languageCode
        },
        components: []
      }
    };
    
    // Agregar componentes si existen
    if (request.components?.header) {
      templatePayload.template.components.push({
        type: 'header',
        parameters: request.components.header.parameters
      });
    }
    
    if (request.components?.body) {
      templatePayload.template.components.push({
        type: 'body',
        parameters: request.components.body.parameters
      });
    }
    
    if (request.components?.buttons) {
      request.components.buttons.forEach(button => {
        templatePayload.template.components.push({
          type: 'button',
          sub_type: button.type,
          index: button.index,
          parameters: button.parameters
        });
      });
    }
    
    // Enviar a Kapso
    console.log('Enviando template a Kapso:', JSON.stringify(templatePayload, null, 2));
    
    const kapsoResponse = await fetch(`${KAPSO_BASE_URL}/${KAPSO_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KAPSO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });
    
    const kapsoData = await kapsoResponse.json();
    
    if (!kapsoResponse.ok) {
      console.error('Error de Kapso:', kapsoData);
      throw new Error(kapsoData.error?.message || 'Error al enviar template');
    }
    
    // Registrar en base de datos
    const messageRecord = {
      chat_id: normalizedPhone,
      message_id: kapsoData.messages?.[0]?.id,
      sender_phone: KAPSO_PHONE_NUMBER_ID,
      message_text: `[Template: ${request.templateName}]`,
      message_type: 'template',
      is_from_bot: true,
      ticket_id: request.context?.ticket_id || null,
      created_at: new Date().toISOString()
    };
    
    await supabase.from('whatsapp_messages').insert(messageRecord);
    
    // Actualizar whatsapp_templates con uso
    await supabase
      .from('whatsapp_templates')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('name', request.templateName);
    
    console.log(`Template enviado exitosamente a ${normalizedPhone}. ID: ${kapsoData.messages?.[0]?.id}`);
    
    return new Response(JSON.stringify({
      success: true,
      message_id: kapsoData.messages?.[0]?.id,
      to: normalizedPhone,
      template: request.templateName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error en kapso-send-template:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## Fase 3: Webhook para Comunicación Entrante (Bidireccional)

### 3.1 Edge Function: `kapso-webhook-receiver`

**Propósito:** Recibir y procesar todos los eventos de WhatsApp desde Kapso

**Archivo:** `supabase/functions/kapso-webhook-receiver/index.ts`

**Estructura completa:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kapso-signature',
};

interface KapsoWebhookPayload {
  event: string;
  timestamp: string;
  data: {
    id?: string;
    from?: string;
    to?: string;
    timestamp?: string;
    type?: string;
    text?: { body: string };
    image?: { id: string; mime_type: string; caption?: string };
    document?: { id: string; filename: string; mime_type: string };
    interactive?: {
      type: string;
      button_reply?: { id: string; title: string };
      list_reply?: { id: string; title: string };
    };
    status?: string;
    conversation?: { id: string };
    context?: { message_id: string };
  };
}

serve(async (req) => {
  // Verificación de webhook (GET request de Kapso/Meta)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    const VERIFY_TOKEN = Deno.env.get('KAPSO_WEBHOOK_VERIFY_TOKEN') || 'detecta_kapso_webhook';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado exitosamente');
      return new Response(challenge, { status: 200 });
    }
    
    return new Response('Verification failed', { status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: KapsoWebhookPayload = await req.json();
    
    console.log('Webhook recibido:', JSON.stringify(payload, null, 2));
    
    // Procesar según tipo de evento
    switch (payload.event) {
      case 'whatsapp.message.received':
        await handleIncomingMessage(supabase, payload);
        break;
        
      case 'whatsapp.message.delivered':
        await handleDeliveryStatus(supabase, payload, 'delivered');
        break;
        
      case 'whatsapp.message.read':
        await handleDeliveryStatus(supabase, payload, 'read');
        break;
        
      case 'whatsapp.message.failed':
        await handleDeliveryStatus(supabase, payload, 'failed');
        break;
        
      default:
        console.log('Evento no manejado:', payload.event);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error en kapso-webhook-receiver:', error);
    // Siempre responder 200 para evitar reintentos
    return new Response(JSON.stringify({ 
      received: true, 
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleIncomingMessage(supabase: any, payload: KapsoWebhookPayload) {
  const { data } = payload;
  const senderPhone = data.from!;
  const messageType = data.type || 'text';
  
  // Extraer contenido del mensaje
  let messageText = '';
  let mediaUrl = null;
  
  if (data.text) {
    messageText = data.text.body;
  } else if (data.image) {
    messageText = data.image.caption || '[Imagen]';
    mediaUrl = data.image.id; // ID de media para descargar
  } else if (data.document) {
    messageText = `[Documento: ${data.document.filename}]`;
    mediaUrl = data.document.id;
  } else if (data.interactive) {
    // Respuesta a botón o lista
    const reply = data.interactive.button_reply || data.interactive.list_reply;
    messageText = reply?.title || '[Respuesta interactiva]';
    
    // Procesar respuesta interactiva
    await handleInteractiveResponse(supabase, senderPhone, reply!);
  }
  
  // Guardar mensaje en base de datos
  const messageRecord = {
    chat_id: senderPhone,
    message_id: data.id,
    sender_phone: senderPhone,
    sender_name: null, // Se puede enriquecer con datos del perfil
    message_text: messageText,
    message_type: messageType,
    media_url: mediaUrl,
    is_from_bot: false,
    is_read: false,
    created_at: new Date().toISOString()
  };
  
  const { data: insertedMsg, error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert(messageRecord)
    .select()
    .single();
  
  if (msgError) {
    console.error('Error guardando mensaje:', msgError);
  }
  
  // Buscar si hay un ticket abierto con este chat
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('id, ticket_number, status')
    .eq('whatsapp_chat_id', senderPhone)
    .neq('status', 'cerrado')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (existingTicket) {
    // Agregar mensaje como respuesta al ticket
    await supabase.from('ticket_respuestas').insert({
      ticket_id: existingTicket.id,
      autor_id: null, // Usuario externo (custodio vía WhatsApp)
      autor_tipo: 'custodio',
      autor_nombre: senderPhone,
      mensaje: messageText,
      es_resolucion: false,
      es_interno: false,
      created_at: new Date().toISOString()
    });
    
    // Actualizar mensaje con ticket_id
    if (insertedMsg) {
      await supabase
        .from('whatsapp_messages')
        .update({ ticket_id: existingTicket.id })
        .eq('id', insertedMsg.id);
    }
    
    console.log(`Mensaje vinculado a ticket existente: ${existingTicket.ticket_number}`);
  } else {
    // Verificar si es un custodio activo
    const { data: custodio } = await supabase
      .from('profiles')
      .select('id, full_name, role, telefono')
      .or(`telefono.eq.${senderPhone},telefono.ilike.%${senderPhone.slice(-10)}%`)
      .eq('role', 'custodio')
      .maybeSingle();
    
    if (custodio) {
      // Crear ticket automático para custodio
      const ticketNumber = `TKT-WA-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: newTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          customer_phone: senderPhone,
          customer_name: custodio.full_name,
          subject: `Mensaje de WhatsApp de ${custodio.full_name}`,
          description: messageText,
          status: 'abierto',
          priority: 'media',
          category: 'soporte_custodio',
          source: 'whatsapp',
          whatsapp_chat_id: senderPhone,
          custodio_id: custodio.id,
          custodio_telefono: senderPhone,
          tipo_ticket: 'soporte_whatsapp'
        })
        .select()
        .single();
      
      if (!ticketError && newTicket) {
        // Actualizar mensaje con ticket_id
        if (insertedMsg) {
          await supabase
            .from('whatsapp_messages')
            .update({ ticket_id: newTicket.id })
            .eq('id', insertedMsg.id);
        }
        
        console.log(`Ticket creado automáticamente: ${ticketNumber}`);
        
        // Enviar respuesta automática
        await sendAutoReply(supabase, senderPhone, custodio.full_name, ticketNumber);
      }
    } else {
      console.log(`Mensaje de número desconocido: ${senderPhone}`);
      // Opcional: Respuesta genérica para números no registrados
    }
  }
}

async function handleInteractiveResponse(supabase: any, phone: string, reply: { id: string; title: string }) {
  console.log(`Respuesta interactiva de ${phone}: ${reply.id} - ${reply.title}`);
  
  // Buscar contexto del mensaje original
  const buttonId = reply.id;
  
  // Ejemplos de acciones según ID del botón
  if (buttonId.startsWith('CONFIRM_SERVICE_')) {
    const serviceId = buttonId.replace('CONFIRM_SERVICE_', '');
    await handleServiceConfirmation(supabase, phone, serviceId, true);
  } else if (buttonId.startsWith('REJECT_SERVICE_')) {
    const serviceId = buttonId.replace('REJECT_SERVICE_', '');
    await handleServiceConfirmation(supabase, phone, serviceId, false);
  } else if (buttonId.startsWith('NEED_HELP_')) {
    // Crear ticket de ayuda
    await createHelpTicket(supabase, phone);
  }
}

async function handleServiceConfirmation(supabase: any, phone: string, serviceId: string, accepted: boolean) {
  if (accepted) {
    // Actualizar estado del servicio
    await supabase
      .from('servicios_planificados')
      .update({
        estado_confirmacion_custodio: 'confirmado',
        fecha_confirmacion: new Date().toISOString()
      })
      .eq('id', serviceId);
    
    console.log(`Servicio ${serviceId} confirmado por ${phone}`);
  } else {
    // Marcar como rechazado para reasignación
    await supabase
      .from('servicios_planificados')
      .update({
        estado_confirmacion_custodio: 'rechazado',
        requiere_reasignacion: true
      })
      .eq('id', serviceId);
    
    console.log(`Servicio ${serviceId} rechazado por ${phone}`);
    
    // TODO: Notificar a planificación para reasignar
  }
}

async function createHelpTicket(supabase: any, phone: string) {
  // Implementar creación de ticket de ayuda
  console.log(`Solicitud de ayuda de ${phone}`);
}

async function handleDeliveryStatus(supabase: any, payload: KapsoWebhookPayload, status: string) {
  const messageId = payload.data.id;
  
  if (messageId) {
    await supabase
      .from('whatsapp_messages')
      .update({ 
        is_read: status === 'read',
        delivery_status: status
      })
      .eq('message_id', messageId);
    
    console.log(`Mensaje ${messageId} actualizado a: ${status}`);
  }
}

async function sendAutoReply(supabase: any, phone: string, custodioName: string, ticketNumber: string) {
  // Invocar función de envío
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/kapso-send-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: phone,
      type: 'text',
      text: `¡Hola ${custodioName}! 👋\n\nHemos recibido tu mensaje y creado el ticket ${ticketNumber}.\n\nUn agente te responderá pronto. Mientras tanto, puedes seguir enviando mensajes aquí.\n\n🛡️ Equipo Detecta`
    })
  });
  
  console.log('Auto-reply enviado:', await response.json());
}
```

### 3.2 Actualizar Tabla para Delivery Status

**Migración SQL:**

```sql
-- Agregar campo para tracking de delivery
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS 
  delivery_status TEXT DEFAULT 'sent' 
  CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed'));

-- Índice para consultas de mensajes no leídos
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
  ON whatsapp_messages(chat_id, is_read) 
  WHERE is_read = false;

-- Agregar campos para confirmación de servicio
ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  estado_confirmacion_custodio TEXT 
  CHECK (estado_confirmacion_custodio IN ('pendiente', 'confirmado', 'rechazado'));

ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  fecha_confirmacion TIMESTAMPTZ;

ALTER TABLE servicios_planificados ADD COLUMN IF NOT EXISTS 
  requiere_reasignacion BOOLEAN DEFAULT false;
```

---

## Fase 4: Integración con Módulos Existentes

### 4.1 Actualizar `InvitationActionsDropdown.tsx`

**Cambios requeridos:**

Reemplazar el enlace `wa.me` por llamada a la edge function:

```typescript
// ANTES (líneas 101-122 actuales)
const handleWhatsApp = () => {
  const link = getInvitationLink(invitation.token);
  const message = encodeURIComponent(...);
  window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
};

// DESPUÉS
const handleWhatsApp = async () => {
  setLoading(true);
  try {
    const link = getInvitationLink(invitation.token);
    const { data, error } = await supabase.functions.invoke('kapso-send-template', {
      body: {
        to: invitation.telefono,
        templateName: 'custodio_invitacion',
        components: {
          body: {
            parameters: [
              { type: 'text', text: invitation.nombre || 'Custodio' },
              { type: 'text', text: link }
            ]
          }
        },
        context: {
          invitation_id: invitation.id,
          tipo_notificacion: 'invitacion_custodio'
        }
      }
    });
    
    if (error) throw error;
    
    toast({
      title: 'Mensaje enviado',
      description: `Invitación enviada por WhatsApp a ${invitation.telefono}`,
    });
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    toast({
      title: 'Error',
      description: 'No se pudo enviar el mensaje. ¿Deseas intentar con wa.me?',
      variant: 'destructive',
    });
    // Fallback a wa.me
    const link = getInvitationLink(invitation.token);
    const message = encodeURIComponent(`¡Hola ${invitation.nombre}! ...`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  } finally {
    setLoading(false);
  }
};
```

### 4.2 Actualizar `PendingAssignmentModal.tsx`

**Envío de notificación de asignación con botones interactivos:**

```typescript
const notifyAssignment = async (custodio: CustodioConProximidad, serviceData: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('kapso-send-message', {
      body: {
        to: custodio.telefono,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: '🛡️ NUEVO SERVICIO ASIGNADO',
          body: `Hola ${custodio.nombre},\n\nSe te ha asignado un nuevo servicio:\n\n📍 Cliente: ${serviceData.nombre_cliente}\n📅 Fecha: ${serviceData.fecha}\n⏰ Hora: ${serviceData.hora}\n📌 Origen: ${serviceData.origen}\n\n¿Confirmas tu disponibilidad?`,
          footer: 'Detecta - Sistema de Custodios',
          buttons: [
            { id: `CONFIRM_SERVICE_${serviceData.id}`, title: '✅ Confirmar' },
            { id: `REJECT_SERVICE_${serviceData.id}`, title: '❌ No disponible' },
            { id: `NEED_HELP_${serviceData.id}`, title: '❓ Necesito ayuda' }
          ]
        },
        context: {
          servicio_id: serviceData.id,
          custodio_telefono: custodio.telefono,
          tipo_notificacion: 'asignacion_servicio'
        }
      }
    });
    
    if (error) throw error;
    
    toast.success(`Notificación enviada a ${custodio.nombre}`);
  } catch (error) {
    console.error('Error notificando asignación:', error);
    // Fallback a wa.me
    window.open(`https://wa.me/52${custodio.telefono.replace(/\D/g, '')}`, '_blank');
  }
};
```

### 4.3 Actualizar `ChecklistAlertPanel.tsx`

**Recordatorio automático con botón de respuesta:**

```typescript
const sendChecklistReminder = async (servicio: any) => {
  try {
    await supabase.functions.invoke('kapso-send-message', {
      body: {
        to: servicio.custodioTelefono,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: '⚠️ CHECKLIST PENDIENTE',
          body: `${servicio.custodioNombre}, tienes un checklist pre-servicio pendiente para:\n\n🚗 Servicio: ${servicio.idServicio}\n👤 Cliente: ${servicio.nombreCliente}\n⏰ Hora cita: ${servicio.horaCita}\n\nCompleta el checklist desde la app Detecta.`,
          buttons: [
            { id: `CHECKLIST_STARTED_${servicio.id}`, title: '✅ Ya lo inicié' },
            { id: `CHECKLIST_HELP_${servicio.id}`, title: '❓ Tengo un problema' }
          ]
        },
        context: {
          servicio_id: servicio.id,
          custodio_telefono: servicio.custodioTelefono,
          tipo_notificacion: 'recordatorio_checklist'
        }
      }
    });
    
    toast.success('Recordatorio enviado por WhatsApp');
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
  }
};
```

### 4.4 Actualizar `WhatsAppManager.tsx` (Settings)

**Nuevo componente con configuración de Kapso:**

```typescript
// Agregar nueva pestaña "Kapso"
<TabsContent value="kapso" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Configuración de Kapso
      </CardTitle>
      <CardDescription>
        Configuración de la integración con Kapso WhatsApp API
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label>Estado de Conexión</Label>
        <div className="flex items-center gap-2">
          <Badge variant={kapsoConnected ? "default" : "secondary"}>
            {kapsoConnected ? '✅ Conectado' : '⚠️ Desconectado'}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Phone Number ID</Label>
        <Input 
          value={kapsoPhoneNumberId}
          placeholder="Ej: 647015955153740"
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Configurado en variables de entorno
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <div className="flex gap-2">
          <Input 
            value={webhookUrl}
            readOnly
          />
          <Button variant="outline" onClick={copyWebhookUrl}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Configura esta URL en el dashboard de Kapso
        </p>
      </div>
      
      <Button onClick={testConnection}>
        <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
        Probar Conexión
      </Button>
    </CardContent>
  </Card>
</TabsContent>
```

---

## Fase 5: Templates de WhatsApp para Aprobar en Meta

### 5.1 Templates Requeridos

Estos templates deben ser creados y aprobados en Meta Business Suite:

**1. custodio_invitacion**
```
Categoría: UTILITY
Idioma: es_MX

Header: 🛡️ DETECTA - Bienvenido al Equipo
Body: 
¡Hola {{1}}! 🎉

Ya eres parte del equipo de custodios de Detecta.

Para activar tu cuenta, usa este link:
{{2}}

⚠️ Este link es personal y expira en 30 días.

Equipo Detecta
```

**2. servicio_asignado**
```
Categoría: UTILITY
Idioma: es_MX

Header: 📋 NUEVO SERVICIO ASIGNADO
Body:
Hola {{1}},

Se te ha asignado un nuevo servicio:

👤 Cliente: {{2}}
📅 Fecha: {{3}}
⏰ Hora: {{4}}
📍 Origen: {{5}}

Confirma tu disponibilidad en la app.

Buttons:
- ✅ Confirmar
- ❌ No disponible
```

**3. recordatorio_servicio**
```
Categoría: UTILITY
Idioma: es_MX

Header: ⏰ RECORDATORIO DE SERVICIO
Body:
{{1}}, tu servicio inicia en {{2}} minutos.

👤 Cliente: {{3}}
📍 Origen: {{4}}

Recuerda completar el checklist pre-servicio.

Buttons:
- ✅ Ya estoy listo
- ❓ Tengo un problema
```

**4. alerta_checklist**
```
Categoría: UTILITY
Idioma: es_MX

Header: ⚠️ CHECKLIST PENDIENTE
Body:
{{1}}, tienes un checklist pendiente para el servicio {{2}}.

Completa el checklist desde la app Detecta antes de iniciar el servicio.

Buttons:
- ✅ Abrir App
- ❓ Necesito ayuda
```

**5. ticket_actualizado**
```
Categoría: UTILITY
Idioma: es_MX

Header: 🎫 ACTUALIZACIÓN DE TICKET
Body:
Tu ticket {{1}} ha sido actualizado:

Estado: {{2}}
Mensaje: {{3}}

Puedes responder a este mensaje para continuar la conversación.
```

---

## Fase 6: Casos de Uso de Comunicación Bidireccional

### 6.1 Flujo de Tickets de Soporte via WhatsApp

```
CUSTODIO                          DETECTA SYSTEM
    │                                   │
    │ [Envía mensaje WhatsApp]          │
    ├──────────────────────────────────►│
    │                                   │ → Webhook recibe mensaje
    │                                   │ → Busca tickets abiertos
    │                                   │ → Si no hay, crea nuevo
    │                                   │ → Guarda en whatsapp_messages
    │                                   │
    │    [Auto-reply: Ticket creado]    │
    │◄──────────────────────────────────┤
    │                                   │
    │                        [Agente responde en panel]
    │                                   │
    │    [Respuesta del agente]         │
    │◄──────────────────────────────────┤
    │                                   │
    │ [Custodio responde]               │
    ├──────────────────────────────────►│
    │                                   │ → Webhook vincula a ticket
    │                                   │ → Agrega como ticket_respuesta
    │                                   │
    │         [... conversación continúa ...]
```

### 6.2 Flujo de Confirmación de Servicio

```
PLANIFICADOR                      SYSTEM                         CUSTODIO
    │                                │                                │
    │ [Asigna servicio]              │                                │
    ├───────────────────────────────►│                                │
    │                                │ → Guarda asignación            │
    │                                │ → Llama kapso-send-message     │
    │                                │                                │
    │                                │   [Mensaje con botones]        │
    │                                ├───────────────────────────────►│
    │                                │                                │
    │                                │                                │ [Click ✅ Confirmar]
    │                                │◄───────────────────────────────┤
    │                                │                                │
    │                                │ → Webhook recibe button_reply  │
    │                                │ → Actualiza estado servicio    │
    │                                │                                │
    │  [Notificación de confirmación]│                                │
    │◄───────────────────────────────┤                                │
```

### 6.3 Flujo de Alerta de Checklist

```
CRON JOB (cada 5 min)             SYSTEM                         CUSTODIO
    │                                │                                │
    │ [Trigger verificación]         │                                │
    ├───────────────────────────────►│                                │
    │                                │ → Busca servicios próximos     │
    │                                │ → Filtra sin checklist         │
    │                                │ → Para cada uno:               │
    │                                │   → Llama kapso-send-message   │
    │                                │                                │
    │                                │   [Alerta con botones]         │
    │                                ├───────────────────────────────►│
    │                                │                                │
    │                                │          [Click ❓ Problema]   │
    │                                │◄───────────────────────────────┤
    │                                │                                │
    │                                │ → Crea ticket automático       │
    │                                │ → Notifica a monitoreo         │
```

---

## Fase 7: Hook Centralizado para WhatsApp

### 7.1 Crear `useKapsoWhatsApp.ts`

**Archivo:** `src/hooks/useKapsoWhatsApp.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendMessageParams {
  to: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  text?: string;
  mediaUrl?: string;
  mediaCaption?: string;
  filename?: string;
  interactive?: {
    type: 'button' | 'list';
    header?: string;
    body: string;
    footer?: string;
    buttons?: Array<{ id: string; title: string }>;
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
  context?: {
    servicio_id?: string;
    ticket_id?: string;
    custodio_telefono?: string;
    tipo_notificacion?: string;
  };
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: {
    header?: { type: string; parameters?: any[] };
    body?: { parameters: Array<{ type: 'text'; text: string }> };
    buttons?: Array<{ type: string; index: number; parameters?: any[] }>;
  };
  context?: Record<string, string>;
}

export const useKapsoWhatsApp = () => {
  // Enviar mensaje genérico
  const sendMessage = useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const { data, error } = await supabase.functions.invoke('kapso-send-message', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Mensaje enviado', {
        description: `ID: ${data.message_id}`
      });
    },
    onError: (error) => {
      console.error('Error enviando mensaje:', error);
      toast.error('Error al enviar mensaje', {
        description: error.message
      });
    }
  });
  
  // Enviar template
  const sendTemplate = useMutation({
    mutationFn: async (params: SendTemplateParams) => {
      const { data, error } = await supabase.functions.invoke('kapso-send-template', {
        body: params
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Template enviado', {
        description: `Template: ${data.template}`
      });
    },
    onError: (error) => {
      console.error('Error enviando template:', error);
      toast.error('Error al enviar template', {
        description: error.message
      });
    }
  });
  
  // Helpers para casos de uso comunes
  const sendServiceAssignment = async (
    custodioPhone: string,
    custodioName: string,
    serviceData: {
      id: string;
      cliente: string;
      fecha: string;
      hora: string;
      origen: string;
    }
  ) => {
    return sendMessage.mutateAsync({
      to: custodioPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: '🛡️ NUEVO SERVICIO ASIGNADO',
        body: `Hola ${custodioName},\n\nSe te ha asignado:\n\n👤 Cliente: ${serviceData.cliente}\n📅 Fecha: ${serviceData.fecha}\n⏰ Hora: ${serviceData.hora}\n📍 Origen: ${serviceData.origen}`,
        footer: 'Detecta - Sistema de Custodios',
        buttons: [
          { id: `CONFIRM_SERVICE_${serviceData.id}`, title: '✅ Confirmar' },
          { id: `REJECT_SERVICE_${serviceData.id}`, title: '❌ No disponible' }
        ]
      },
      context: {
        servicio_id: serviceData.id,
        custodio_telefono: custodioPhone,
        tipo_notificacion: 'asignacion_servicio'
      }
    });
  };
  
  const sendChecklistReminder = async (
    custodioPhone: string,
    custodioName: string,
    servicioId: string,
    cliente: string
  ) => {
    return sendMessage.mutateAsync({
      to: custodioPhone,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: '⚠️ CHECKLIST PENDIENTE',
        body: `${custodioName}, completa el checklist pre-servicio para:\n\n📋 Servicio: ${servicioId}\n👤 Cliente: ${cliente}`,
        buttons: [
          { id: `CHECKLIST_DONE_${servicioId}`, title: '✅ Ya lo completé' },
          { id: `CHECKLIST_HELP_${servicioId}`, title: '❓ Necesito ayuda' }
        ]
      },
      context: {
        servicio_id: servicioId,
        custodio_telefono: custodioPhone,
        tipo_notificacion: 'recordatorio_checklist'
      }
    });
  };
  
  const sendCustodianInvitation = async (
    phone: string,
    name: string,
    invitationLink: string,
    invitationId: string
  ) => {
    return sendTemplate.mutateAsync({
      to: phone,
      templateName: 'custodio_invitacion',
      components: {
        body: {
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: invitationLink }
          ]
        }
      },
      context: {
        invitation_id: invitationId,
        tipo_notificacion: 'invitacion_custodio'
      }
    });
  };
  
  const sendTicketUpdate = async (
    phone: string,
    ticketNumber: string,
    status: string,
    message: string
  ) => {
    return sendTemplate.mutateAsync({
      to: phone,
      templateName: 'ticket_actualizado',
      components: {
        body: {
          parameters: [
            { type: 'text', text: ticketNumber },
            { type: 'text', text: status },
            { type: 'text', text: message }
          ]
        }
      },
      context: {
        tipo_notificacion: 'ticket_update'
      }
    });
  };
  
  return {
    // Mutaciones base
    sendMessage,
    sendTemplate,
    
    // Helpers específicos
    sendServiceAssignment,
    sendChecklistReminder,
    sendCustodianInvitation,
    sendTicketUpdate,
    
    // Estados
    isSending: sendMessage.isPending || sendTemplate.isPending
  };
};
```

---

## Fase 8: Actualización de config.toml

**Archivo:** `supabase/config.toml`

Agregar las nuevas funciones:

```toml
[functions.kapso-send-message]
verify_jwt = true

[functions.kapso-send-template]
verify_jwt = true

[functions.kapso-webhook-receiver]
verify_jwt = false  # Webhooks externos no tienen JWT
```

---

## Fase 9: Plan de Migración

### 9.1 Orden de Implementación

**Semana 1: Infraestructura Base**
1. Configurar secrets en Supabase (KAPSO_API_KEY, KAPSO_PHONE_NUMBER_ID)
2. Crear migraciones SQL para nuevos campos
3. Implementar `kapso-send-message` edge function
4. Implementar `kapso-send-template` edge function
5. Probar envío de mensajes desde edge function

**Semana 2: Webhook y Bidireccionalidad**
1. Implementar `kapso-webhook-receiver` edge function
2. Configurar webhook URL en dashboard de Kapso
3. Probar recepción de mensajes
4. Implementar creación automática de tickets
5. Probar flujo completo de conversación

**Semana 3: Integración de Módulos**
1. Crear hook `useKapsoWhatsApp`
2. Actualizar `InvitationActionsDropdown`
3. Actualizar `PendingAssignmentModal`
4. Actualizar `ChecklistAlertPanel`
5. Actualizar `LiberacionSuccessModal`

**Semana 4: Templates y UI**
1. Crear y enviar templates a aprobación de Meta
2. Actualizar `WhatsAppManager` con configuración Kapso
3. Crear UI para ver historial de mensajes
4. Testing end-to-end de todos los flujos
5. Documentación y capacitación

### 9.2 Fallback durante Migración

Durante la migración, mantener el sistema `wa.me` como fallback:

```typescript
const sendWhatsAppWithFallback = async (params) => {
  try {
    // Intentar con Kapso
    await kapso.sendMessage(params);
  } catch (error) {
    console.warn('Kapso falló, usando fallback wa.me');
    // Fallback a wa.me
    const message = encodeURIComponent(params.text);
    window.open(`https://wa.me/${params.to}?text=${message}`, '_blank');
  }
};
```

---

## Resumen de Archivos a Crear/Modificar

### Archivos Nuevos (7)
| Archivo | Propósito |
|---------|-----------|
| `supabase/functions/kapso-send-message/index.ts` | Envío de mensajes |
| `supabase/functions/kapso-send-template/index.ts` | Envío de templates |
| `supabase/functions/kapso-webhook-receiver/index.ts` | Recepción de mensajes |
| `supabase/migrations/XXXXXX_kapso_integration.sql` | Cambios en BD |
| `src/hooks/useKapsoWhatsApp.ts` | Hook centralizado |
| `src/types/kapso.ts` | Tipos TypeScript |
| `src/components/settings/KapsoConfig.tsx` | UI de configuración |

### Archivos a Modificar (10)
| Archivo | Cambio |
|---------|--------|
| `supabase/config.toml` | Agregar nuevas funciones |
| `src/components/admin/InvitationActionsDropdown.tsx` | Usar Kapso |
| `src/components/planeacion/PendingAssignmentModal.tsx` | Usar Kapso |
| `src/components/planeacion/ReassignmentModal.tsx` | Usar Kapso |
| `src/components/liberacion/LiberacionSuccessModal.tsx` | Usar Kapso |
| `src/components/monitoring/checklist/ChecklistAlertPanel.tsx` | Usar Kapso |
| `src/components/monitoring/checklist/ChecklistDetailModal.tsx` | Usar Kapso |
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Usar Kapso |
| `src/components/leads/approval/SendSIERCPDialog.tsx` | Usar Kapso |
| `src/components/settings/WhatsAppManager.tsx` | Agregar config Kapso |

---

## Verificación Post-Implementación

### Tests a Realizar

1. **Envío de mensaje de texto simple**
2. **Envío de mensaje con imagen**
3. **Envío de mensaje interactivo con botones**
4. **Recepción de mensaje de custodio**
5. **Click en botón interactivo y procesamiento**
6. **Creación automática de ticket desde WhatsApp**
7. **Vinculación de mensajes a ticket existente**
8. **Envío de template aprobado**
9. **Tracking de delivery status (delivered/read)**
10. **Fallback a wa.me si Kapso falla**

### Queries de Verificación

```sql
-- Verificar mensajes enviados
SELECT * FROM whatsapp_messages 
WHERE is_from_bot = true 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar mensajes recibidos
SELECT * FROM whatsapp_messages 
WHERE is_from_bot = false 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar tickets creados desde WhatsApp
SELECT * FROM tickets 
WHERE source = 'whatsapp' 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar confirmaciones de servicio
SELECT id, custodio_asignado, estado_confirmacion_custodio, fecha_confirmacion 
FROM servicios_planificados 
WHERE estado_confirmacion_custodio IS NOT NULL 
ORDER BY fecha_confirmacion DESC 
LIMIT 10;
```
