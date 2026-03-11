

# Fix: Inbound messages en Test Comm sin restricción de custodio/cliente

## Problema

Cuando envías un template o mensaje desde "Pruebas Comm" y respondes desde tu teléfono, el webhook receiver busca un servicio activo donde `custodio_telefono` coincida con tu número. Como no eres custodio, el mensaje se guarda con `servicio_id = NULL` y no aparece en ningún chat de servicio.

## Solución

Agregar un **fallback por chat_id** en `handleIncomingMessage`: si no se encuentra servicio activo por teléfono del custodio, buscar el último mensaje saliente (`is_from_bot = true`) al mismo `chat_id` que tenga `servicio_id` y heredarlo.

Esto resuelve tanto el caso de pruebas como el caso real donde un custodio responde a un template pero su teléfono tiene formato diferente al almacenado.

## Cambio

**Archivo:** `supabase/functions/kapso-webhook-receiver/index.ts`

Después de la búsqueda actual de servicio activo (~línea 274-279), agregar:

```typescript
// Fallback: heredar servicio_id del último mensaje saliente al mismo chat_id
if (!servicioId) {
  const { data: lastOutbound } = await supabase
    .from('whatsapp_messages')
    .select('servicio_id')
    .eq('chat_id', senderPhone)
    .eq('is_from_bot', true)
    .not('servicio_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastOutbound?.servicio_id) {
    servicioId = lastOutbound.servicio_id;
    console.log(`🔗 Servicio heredado del último mensaje saliente: ${servicioId}`);
  }
}
```

```text
Flujo actual:
  teléfono → buscar custodio activo → no encontró → servicio_id = NULL ❌

Flujo corregido:
  teléfono → buscar custodio activo → no encontró
    → buscar último mensaje saliente al mismo chat_id con servicio_id → heredar ✅
```

Un solo archivo, un solo bloque de código. Deploy inmediato.

