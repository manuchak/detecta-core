

# Fix: Mensajes no visibles en la Vista de Conversación

## Diagnóstico

El problema es un **mismatch de formato de teléfono** entre la UI y la base de datos:

```text
UI (normalizePhone):     5518095686        ← últimos 10 dígitos
DB (chat_id real):       5215518095686     ← 13 dígitos con prefijo 521
```

La función `normalizePhone()` en `src/lib/phoneUtils.ts` devuelve los últimos 10 dígitos, pero `kapso-send-message` normaliza a 13 dígitos con prefijo `521` antes de guardar en `whatsapp_messages.chat_id`. La consulta en `ConversationSection` filtra `.eq('chat_id', phone)` con el formato de 10 dígitos, por lo que nunca encuentra los mensajes.

El mismo problema afecta a `PersistenceSection` y `ReceiveSimSection`.

## Solución

En `CommTestPanel.tsx`, modificar las queries de `ConversationSection` y `PersistenceSection` para buscar por **ambas variantes del teléfono** (10 dígitos y 13 dígitos con prefijo `521`):

```typescript
// Antes:
.eq('chat_id', phone)

// Después:
.in('chat_id', [phone, `521${phone}`])
```

También aplicar lo mismo al filtro del canal realtime, que actualmente usa `filter: chat_id=eq.${phone}` — cambiar para escuchar ambos formatos o usar el formato largo.

### Cambios concretos en `src/components/monitoring/comm/CommTestPanel.tsx`:

1. **`ConversationSection.fetchMessages`** (~línea 647): Cambiar `.eq('chat_id', phone)` → `.in('chat_id', [phone, '521' + phone])`
2. **`ConversationSection` realtime** (~línea 667): Suscribirse a ambas variantes del chat_id
3. **`ConversationSection.handleQuickSend`** — el envío como monitorista ya usa la edge function que normaliza correctamente; el envío como custodio (sim) inserta directo con `chat_id: phone` (10 dígitos), lo que también causa un mismatch. Cambiar a usar `521${phone}` para consistencia.
4. **`PersistenceSection.fetchRows`** (~línea 803): Mismo cambio `.in('chat_id', [phone, '521' + phone])`

### Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/comm/CommTestPanel.tsx` | Queries y realtime usan ambas variantes de chat_id |

