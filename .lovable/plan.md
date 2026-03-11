

# Análisis Fishbone: Templates WhatsApp No Recibidos

## Resumen de Hallazgos

Tracé la secuencia completa de envío. **Desde el código, todo funciona correctamente:**

```text
┌──────────┐    ┌───────────────┐    ┌─────────┐    ┌──────┐    ┌─────────┐
│ Frontend │───▶│ Edge Function │───▶│ Kapso   │───▶│ Meta │───▶│ Teléfono│
│ CommTest │    │ send-template │    │ API     │    │ WA   │    │ Destino │
│ Panel    │    │               │    │         │    │      │    │         │
│ ✅ OK    │    │ ✅ 200 + wamid│    │ ✅ OK   │    │ ✅?  │    │ ❌ ???  │
└──────────┘    └───────────────┘    └─────────┘    └──────┘    └─────────┘
                       │
                       ▼
                ┌───────────────┐
                │ whatsapp_     │
                │ messages DB   │
                │ ✅ Registrado │
                └───────────────┘
```

## Diagrama Fishbone - Causas Posibles

```text
                          NO LLEGAN MENSAJES AL TELÉFONO
                          ══════════════════════════════
                                      │
        ┌───────────────┬─────────────┼──────────────┬────────────────┐
        │               │             │              │                │
   NORMALIZACIÓN    TEMPLATE EN   WEBHOOK DE     CONFIGURACIÓN     TELÉFONO
   DE TELÉFONO      META/KAPSO    ESTATUS        DE KAPSO          DESTINO
        │               │             │              │                │
  ┌─────┴─────┐   ┌─────┴─────┐  ┌───┴────┐   ┌────┴─────┐   ┌─────┴─────┐
  │521 vs 52  │   │Params no  │  │No hay  │   │Phone ID  │   │Notif off  │
  │(formato   │   │coinciden  │  │webhook │   │incorrecto│   │o bloqueado│
  │México)    │   │con Meta   │  │config. │   │en secret │   │           │
  └───────────┘   └───────────┘  └────────┘   └──────────┘   └───────────┘
      ⚠️ #1           ⚠️ #2        ⚠️ #3          ⚠️ #4          ⚠️ #5
```

## Análisis Detallado por Causa

### ⚠️ #1 ALTA PRIORIDAD - Formato de Número de Teléfono (521 vs 52)

**El problema más probable.** La función `normalizePhoneNumber` en ambas edge functions (`kapso-send-template` y `kapso-send-message`) convierte 10 dígitos → `521` + 10 dígitos.

```
Input:  5518095686 (10 dígitos)
Output: 5215518095686 (con el "1" intercalado)
```

**Desde agosto 2019, México eliminó el prefijo "1" para celulares.** El formato correcto para WhatsApp API es `52` + 10 dígitos = `525518095686` (12 dígitos). Meta acepta ambos formatos en su API, pero en algunos casos el formato con `521` causa que el mensaje se marque como "delivered" sin llegar realmente al dispositivo, porque se entrega a un "número fantasma" en la red de Meta.

**Esto explica por qué Kapso muestra "entregado" pero no llega nada al teléfono.**

**Fix necesario en ambas edge functions:**
```typescript
// ANTES (incorrecto para México moderno)
if (cleaned.length === 10) {
  return '521' + cleaned;  // ❌ 521 ya no es necesario
}

// DESPUÉS (correcto)
if (cleaned.length === 10) {
  return '52' + cleaned;   // ✅ 52 + 10 dígitos
}
```

### ⚠️ #2 MEDIA - Parámetros del Template vs Meta

El template `confirmacion_posicionamiento` tiene 4 variables (`custodio_nombre`, `ubicacion`, `hora`, `servicio_id`) y el payload las envía correctamente. Sin embargo, si el template registrado en Meta tiene un formato diferente (ej. diferente número de variables o tipo de componente), Meta acepta el request pero no entrega el mensaje.

**Verificación necesaria:** Comparar el payload enviado con la definición exacta del template en el Business Manager de Meta.

### ⚠️ #3 MEDIA - Webhook No Configurado

Sin webhook configurado, el sistema **nunca recibe confirmación de delivery/read/failed**. El `delivery_status` en la BD se queda en `sent` para siempre. Esto no causa la no-entrega, pero significa que no hay forma de detectar fallos desde el sistema.

### ⚠️ #4 BAJA - KAPSO_PHONE_NUMBER_ID

El secret existe y funciona (la API responde 200). Pero si apunta a un número de WhatsApp Business diferente al esperado, los mensajes saldrían desde otro número.

### ⚠️ #5 BAJA - Teléfono Destino

El usuario podría tener el número de WhatsApp Business bloqueado, notificaciones desactivadas, o estar revisando un WhatsApp diferente (personal vs business).

## Plan de Corrección

### Archivos a modificar:

| Archivo | Cambio |
|---|---|
| `supabase/functions/kapso-send-template/index.ts` | Fix `normalizePhoneNumber`: `10 dígitos → '52' + dígitos` (sin el 1) |
| `supabase/functions/kapso-send-message/index.ts` | Mismo fix de normalización |

### La función corregida:

```typescript
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');
  
  if (cleaned.length === 10) {
    return '52' + cleaned;           // MX: 52 + 10 dígitos
  } else if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return cleaned;                   // Ya correcto: 52 + 10
  } else if (cleaned.length === 13 && cleaned.startsWith('521')) {
    return '52' + cleaned.slice(3);  // Quitar el 1: 521xxx → 52xxx
  }
  
  return cleaned;
}
```

### Después del fix:
- Probar envío al mismo número
- Si llega, el problema era el formato `521`
- Si no llega, escalar a verificación en el Business Manager de Meta para validar que el template y el Phone Number ID sean correctos

