

# Fix: Schema mismatch in WhatsApp Communication layer

## Problem

The `ServiceCommSheet` is currently broken. Every query to `whatsapp_messages` returns **400** because the hook references columns that don't exist in the actual database:

| Hook references | Actual DB column |
|---|---|
| `content` | `message_text` |
| `media_type` | *(does not exist on whatsapp_messages)* |

This means: no conversations load, no evidence is stored or visible.

## What will work after the fix

Yes -- the panel will serve as a **full evidence trail** for both sides:

1. **Custodio tab**: Every WhatsApp message (text + photos) exchanged with the guard is persisted in `whatsapp_messages` (linked via `servicio_id`). The chat timeline shows the complete conversation history with delivery status and timestamps.

2. **Cliente tab**: The `ClientReportComposer` lets the monitorist select validated photos from `servicio_comm_media` and send a pre-filled template report to the client. The `enviado_a_cliente` / `enviado_a_cliente_at` fields track exactly when each photo was shared.

3. **Persistence**: All messages are stored permanently in Supabase with realtime subscriptions for live updates.

## Plan

### 1. Fix `useServicioComm` hook -- align column names

Update the select query from:
```
content, media_url, media_type, ...
```
to:
```
message_text, media_url, ...
```

Update the `CommMessage` interface: rename `content` to `message_text`, remove `media_type` (derive from `media_url` extension or from `message_type`).

### 2. Fix `useUnreadCounts` hook

Same column alignment (this query only selects `servicio_id` so it may already work, but verify).

### 3. Fix `CustodioChat.tsx`

Replace all references to `m.content` with `m.message_text`. Remove references to `m.media_type`; detect image media from `media_url` presence or `message_type`.

### 4. Fix `ClientReportComposer.tsx`

Same column name updates for any message references.

### 5. Fix `ServiceCommSheet.tsx`

Align any prop passing or message references.

---

**No database migration needed** -- the schema is correct; only the frontend code has wrong column names.

