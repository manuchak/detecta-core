

# Plan: Corregir Link de Recuperación para Redirigir a la App de Producción

## Problema
El link generado por `generateLink` contiene `redirect_to=http://localhost:3000` (el Site URL configurado en Supabase). Cuando el usuario hace clic, Supabase verifica el token y redirige a `localhost:3000/reset-password`, que no existe en su máquina — de ahí el `ERR_CONNECTION_REFUSED`.

## Causa Raíz
`auth.admin.generateLink({ type: 'recovery' })` usa el Site URL del proyecto Supabase como redirect. Si ese valor es `http://localhost:3000`, el link siempre falla en producción.

## Solución
Modificar la Edge Function `generate-recovery-link` para:

1. Recibir el `origin` de la app desde el frontend (o usar un valor por defecto de producción)
2. Parsear el `action_link` devuelto por Supabase y reemplazar el `redirect_to` con la URL correcta de la app (`https://detecta-core.lovable.app/reset-password`)
3. Retornar el link corregido

Esto garantiza que al hacer clic, el usuario llegue a la pantalla de "Nueva contraseña" de la app real, cambie su contraseña y quede logueado.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/generate-recovery-link/index.ts` | Recibir `origin` del frontend, reescribir `redirect_to` en el action_link |
| `src/components/settings/roles/RoleManager.tsx` | Pasar `window.location.origin` al invocar la función |

## Detalle técnico

En la Edge Function, después de obtener `actionLink`:
```
const url = new URL(actionLink);
url.searchParams.set('redirect_to', `${appOrigin}/reset-password`);
const correctedLink = url.toString();
```

El frontend pasa `{ email, origin: window.location.origin }` en el body de la invocación.

