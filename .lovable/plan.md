

# Fishbone: Error "Ocurrió un error al procesar tu solicitud" en Forgot Password

## Causa Raíz

```text
              ┌─────────────────────────────────────┐
              │  Toast: "Ocurrió un error al        │
              │  procesar tu solicitud"              │
              └────────────────┬────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   Edge Function          Resend Config          Frontend
   ─────────────          ────────────           ────────
   No tiene deno.json     Sender domain          Muestra error
   → puede no estar       "detecta.app" en       genérico sin
   desplegada o fallar    Resend pero envía      detalles del
   al importar npm:       desde                  edge function
   resend@4.0.0           notificaciones@
                          detecta.app
                          ¿dominio verificado?
```

**Evidencia clave:**
- Los logs del edge function `send-password-reset` están **completamente vacíos** — ni un solo log, lo que indica que la función **no se está ejecutando** o **no está desplegada correctamente**.
- La función no tiene `deno.json` (a diferencia de otras edge functions del proyecto), lo que puede causar problemas de resolución de dependencias con `npm:resend@4.0.0`.
- El frontend (`ForgotPassword.tsx` línea 37) invoca `supabase.functions.invoke("send-password-reset", ...)` y al recibir un error (probablemente un 500 o connection refused), muestra el toast genérico "Ocurrió un error al procesar tu solicitud".

## Diagnóstico

El problema más probable es que la función **no está desplegada** o falla al arrancar (no produce logs). La ausencia total de logs confirma que el código de la función nunca llega a ejecutarse.

## Fix

### 1. Agregar `deno.json` a la función
Crear `supabase/functions/send-password-reset/deno.json` con las dependencias necesarias para que Deno resuelva correctamente el paquete `resend`.

### 2. Re-desplegar la función
Llamar `deploy_edge_functions` con `send-password-reset` para asegurar que esté activa.

### 3. Verificar dominio en Resend
El email se envía desde `notificaciones@detecta.app` — verificar que ese dominio esté configurado en Resend. Si no, el envío fallará silenciosamente.

| Archivo | Cambio |
|---|---|
| `supabase/functions/send-password-reset/deno.json` | Crear con imports para `resend` |
| Despliegue | Re-deploy de la función |

