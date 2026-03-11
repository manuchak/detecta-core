

# Fix: Imágenes no visibles en conversación WhatsApp

## Diagnóstico confirmado con datos reales

Tres problemas encadenados impiden ver las imágenes:

### Problema 1: El webhook NO descarga media sin servicio_id
```text
Línea 330 de kapso-webhook-receiver:
  if (mediaId && servicioId && insertedMsg)  ← servicioId es NULL → skip
```
La imagen entrante tiene `servicio_id = NULL`, así que `kapso-download-media` nunca se invoca. El `media_url` queda como el raw media ID de Meta (`1872829576733833`), no como una URL real.

### Problema 2: El webhook ignora la URL directa que Kapso ya proporciona
El payload del webhook incluye URLs listas para usar:
- `message.kapso.media_url` → `https://app.kapso.ai/rails/active_storage/...`
- `message.image.link` → misma URL

Pero el código actual solo extrae `data.image.id` (el ID numérico de Meta) y lo guarda como `media_url`.

### Problema 3: La UI de CommTestPanel no renderiza imágenes inline
Solo muestra texto `[image]` y un link "📎 Ver media" que apunta al ID numérico (inútil). No tiene un componente visual para mostrar la imagen como `CustodioChat.MediaBubble`.

## Datos confirmados en DB
```text
message_type: image
media_url:    1872829576733833     ← Es un ID, NO una URL
servicio_id:  NULL                 ← Por eso kapso-download-media no se ejecutó
```

## Solución (4 cambios)

### 1. `kapso-webhook-receiver/index.ts` — Usar URL directa de Kapso + siempre descargar

**Extraer URL directa del payload Kapso** como `media_url` inicial (visible inmediatamente), usando `kapso.media_url` o `image.link`:
```typescript
// En handleIncomingMessage, al procesar image:
if (data.image) {
  messageText = data.image.caption || '[Imagen]';
  mediaId = data.image.id;
  // Usar URL directa de Kapso si disponible (formato nativo)
  mediaUrl = data.image.link || data.image.id;
}
```

**Remover la condición `servicioId` del trigger de descarga**:
```typescript
// Antes:  if (mediaId && servicioId && insertedMsg)
// Después: if (mediaId && insertedMsg)
```

### 2. `kapso-download-media/index.ts` — Hacer servicio_id opcional

Actualmente lanza error si falta `servicio_id`. Cambiarlo a opcional con path fallback:
```typescript
// Antes:
if (!servicio_id) throw new Error('servicio_id is required');
const storagePath = `${servicio_id}/${timestamp}_${media_id}.${ext}`;

// Después:
const folder = servicio_id || 'unlinked';
const storagePath = `${folder}/${timestamp}_${media_id}.${ext}`;
```
Y hacer el insert a `servicio_comm_media` condicional (solo si hay `servicio_id`).

### 3. `kapso-webhook-receiver/index.ts` — Adaptar payload Kapso nativo para media

En el bloque de formato Kapso nativo (línea ~159-176), pasar los campos `image.link` y `kapso.media_url` al adaptedPayload:
```typescript
image: msgData.image ? {
  ...msgData.image,
  link: msgData.kapso?.media_url || msgData.image?.link
} : undefined,
```

### 4. `CommTestPanel.tsx` — Renderizar imágenes inline en la conversación

Agregar un componente `MediaBubble` en la sección de conversación (similar al de CustodioChat) para mostrar preview inline cuando `media_url` es una URL válida:
```typescript
// Dentro del bubble de mensaje:
{msg.media_url && !msg.media_url.match(/^\d+$/) && (
  <img src={msg.media_url} alt="media" 
       className="rounded-lg max-w-[220px] max-h-48 object-cover" />
)}
```

## Flujo corregido
```text
Imagen entrante → webhook receiver
  1. Extrae kapso.media_url como URL temporal inmediata → guarda en DB
  2. Dispara kapso-download-media (sin requerir servicio_id)
  3. kapso-download-media persiste en Storage → actualiza media_url con URL pública permanente
  4. UI muestra preview inline con la URL
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/kapso-webhook-receiver/index.ts` | Extraer URL directa de Kapso; remover condición servicioId para media download; adaptar payload nativo |
| `supabase/functions/kapso-download-media/index.ts` | Hacer servicio_id opcional |
| `src/components/monitoring/comm/CommTestPanel.tsx` | Renderizar imágenes inline en conversación |

3 archivos, 2 edge functions a re-deployar.

