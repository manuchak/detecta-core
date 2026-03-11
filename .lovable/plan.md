

# Diagnóstico: Templates enviados pero no registrados en BD

## Hallazgos

1. **Los templates SÍ se envían correctamente a Kapso/WhatsApp** — los logs muestran `✅ Template enviado exitosamente` con message IDs válidos.

2. **El registro en BD falla** porque la constraint `whatsapp_messages_message_type_check` solo permite: `text`, `image`, `audio`, `document`, `location`. El valor `template` no está permitido, causando:
   ```
   new row for relation "whatsapp_messages" violates check constraint "whatsapp_messages_message_type_check"
   ```

3. **Sobre la no-recepción del mensaje**: Kapso aceptó el request y devolvió un `wamid`. Esto significa que el mensaje fue aceptado por la API de Meta. Si no llegó al teléfono, puede ser:
   - Template con parámetros que no coinciden con lo registrado en Meta (ej: número incorrecto de variables)
   - Número de destino bloqueó la cuenta de negocio
   - Delay de entrega de Meta (a veces tarda minutos)

## Cambio requerido

| Qué | Detalle |
|---|---|
| **Alterar constraint en BD** | Agregar `'template'` a `whatsapp_messages_message_type_check` vía SQL migration |

```sql
ALTER TABLE whatsapp_messages 
DROP CONSTRAINT whatsapp_messages_message_type_check;

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_message_type_check 
CHECK (message_type = ANY (ARRAY['text', 'image', 'audio', 'document', 'location', 'template']));
```

Esto corrige el error de BD. La entrega del template en sí funciona correctamente — el fix asegura que quede registrado en el historial de mensajes.

