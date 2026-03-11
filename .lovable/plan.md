

# Trazabilidad de Monitorista en Conversaciones

## Problema actual

La tabla `whatsapp_messages` tiene `is_from_bot = true` para todo mensaje enviado desde la plataforma, pero **no registra qué monitorista lo envió**. Cuando un servicio cambia de manos (pausa, handoff, reasignación), el nuevo responsable ve burbujas sin autoría — pierde contexto de quién dijo qué y cuándo.

## Solución

### 1. Migración DB: agregar `sent_by_user_id` a `whatsapp_messages`

```sql
ALTER TABLE whatsapp_messages
  ADD COLUMN sent_by_user_id uuid REFERENCES auth.users(id);

CREATE INDEX idx_whatsapp_msg_sent_by ON whatsapp_messages(sent_by_user_id)
  WHERE sent_by_user_id IS NOT NULL;
```

Un campo nullable que se llena **solo** cuando `is_from_bot = true` y el mensaje fue enviado por un monitorista autenticado. Los mensajes del custodio (entrantes) y los automatizados (sistema/webhook) quedan con `NULL`.

### 2. Backend: registrar autoría al enviar

En `ServiceCommSheet.tsx`, las funciones `handleSendMessage` y `handleSendNudge` invocan edge functions. Después de enviar exitosamente, hacer un `UPDATE` al registro del mensaje recién creado con el `user.id` actual:

- Modificar `handleSendMessage` y `handleSendNudge` para obtener `supabase.auth.getUser()` y pasar `sent_by_user_id` en el body de la edge function
- En las edge functions (`kapso-send-message`, `kapso-send-template`), al insertar en `whatsapp_messages`, incluir el campo `sent_by_user_id`

**Alternativa más simple (sin tocar edge functions):** Después de que la edge function responde OK, hacer un UPDATE directo al último mensaje bot insertado para ese servicio, seteando `sent_by_user_id`. Esto es más pragmático y no requiere modificar las edge functions.

### 3. Hook: traer nombre del monitorista

En `useServicioComm.ts`, extender el `select` para incluir `sent_by_user_id` y hacer un join ligero a `profiles` para resolver el `display_name`:

```
.select('..., sent_by_user_id, profiles!sent_by_user_id(display_name)')
```

Actualizar la interfaz `CommMessage` para incluir `sent_by_user_id` y `sender_display_name`.

### 4. UI: mostrar autoría en burbujas bot

En `CustodioChat.tsx`, para mensajes con `is_from_bot = true` y `sent_by_user_id` presente:

- Mostrar un label pequeño arriba de la burbuja azul: **"Ana M."** (primer nombre) en `text-[9px] text-primary-foreground/60`
- Solo mostrar cuando cambia el autor respecto al mensaje anterior (igual que iMessage agrupa por sender)
- Mensajes de sistema (sin `sent_by_user_id`) mostrar etiqueta "Sistema" en gris

### 5. Indicador de handoff en el timeline

Cuando el `sent_by_user_id` cambia entre dos mensajes bot consecutivos, insertar un separador visual:

```
─── 🔄 Ana M. tomó el servicio ───
```

Esto le da al monitorista entrante una señal clara de dónde empezó cada persona, facilitando la lectura rápida del historial.

## Resultado

- **Trazabilidad completa**: cada mensaje enviado desde la plataforma queda firmado con el UUID del monitorista
- **Continuidad en pausas**: al retomar, el nuevo monitorista ve quién dijo qué, con separadores de cambio de turno
- **Continuidad en handoffs**: misma experiencia — el historial completo persiste con autoría
- **Auditoría**: se puede consultar qué instrucciones dio cada monitorista a cada custodio

