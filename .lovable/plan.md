

# Agregar prefijo `1` para celulares mexicanos en WhatsApp

## Problema

Los logs muestran que el mensaje se envió a `525518095686` (formato `52` + 10 dígitos), pero WhatsApp/Meta requiere el formato `521` + 10 dígitos para celulares mexicanos. Esto explica por qué Kapso acepta el request pero el mensaje no llega.

## Cambio

Actualizar `normalizePhoneNumber()` en **2 edge functions** para insertar el `1` después del `52`:

- `52` + 10 dígitos → `521` + 10 dígitos (ej: `525518095686` → `5215518095686`)
- Si ya tiene `521` + 10 dígitos (13 dígitos total), no modificar

Lógica:
```
cleaned = cleaned sin +, espacios, guiones
if 10 dígitos → '521' + cleaned
if 12 dígitos y empieza con '52' → '521' + últimos 10
if 13 dígitos y empieza con '521' → sin cambio
```

## Archivos

| Archivo | Cambio |
|---|---|
| `supabase/functions/kapso-send-message/index.ts` | Actualizar `normalizePhoneNumber` con prefijo `521` |
| `supabase/functions/kapso-send-template/index.ts` | Misma actualización |

Deploy de ambas functions después del cambio.

