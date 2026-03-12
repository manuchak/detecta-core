

# Fase Dev 8 — Broadcast Multi-Contacto

## Situación actual

`ClientChat.tsx` ya construye una lista de contactos (`allContacts`) y permite seleccionar **uno** via `Select`. Los mensajes (texto y templates) se envían solo al contacto seleccionado.

## Cambios

### 1. Reemplazar selector único por checkboxes multi-selección

En `ClientChat.tsx`, cambiar el `<Select>` por una lista de contactos con `<Checkbox>` para seleccionar múltiples destinatarios simultáneamente. Agregar botones "Todos" / "Ninguno" para selección rápida. El estado pasa de `selectedContact: string` a `selectedContacts: Set<string>`.

### 2. Envío individual por contacto (loop)

Modificar `handleSendMessage` y `handleSendTemplate` para iterar sobre `selectedContacts` y enviar un mensaje individual a cada uno. Mostrar toast con resumen ("Enviado a 3 contactos") y manejar errores parciales (si falla uno, reportar cuáles fallaron sin detener los demás).

### 3. Agrupación visual en timeline

Los mensajes salientes enviados en broadcast comparten el mismo timestamp (±2s). Agrupar visualmente burbujas consecutivas con el mismo `message_text` y `is_from_bot=true` que estén dentro de una ventana de 5 segundos, mostrando una sola burbuja con un badge indicando "Enviado a N contactos" en lugar de N burbujas repetidas.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/bitacora/ClientChat.tsx` | Checkboxes multi-contacto, loop de envío, agrupación visual |

### Notas técnicas
- La ventana 24h se evalúa por contacto — solo los que tengan ventana abierta pueden recibir texto libre; los demás solo templates
- El `chat_id` de cada mensaje ya diferencia el destinatario, así que la agrupación visual se basa en timestamp + contenido

