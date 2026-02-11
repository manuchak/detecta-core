

## Plan: Correccion masiva + Validacion del flujo de invitacion

### Parte 1: SQL de correccion (ejecutar en Cloud View > Run SQL - Live)

Los 6 custodios necesitan correccion manual en la base de datos. El SQL fue proporcionado en el mensaje anterior y debe ejecutarse en el entorno Live.

### Parte 2: Validacion y fortalecimiento del flujo de invitacion

Despues de revisar todo el flujo, el camino principal funciona correctamente:

1. Admin genera invitacion -> link con token
2. Custodio abre `/auth/registro-custodio?token=XXX` -> `CustodianSignup` valida token via `validate_invitation_token` RPC
3. Email bloqueado (read-only) desde la invitacion
4. Submit llama edge function `create-custodian-account` -> crea usuario con rol `custodio`
5. Auto-login y redireccion a `/custodian/onboarding`

Sin embargo, hay un escenario no cubierto que puede causar confusion:

| Escenario | Estado actual | Riesgo |
|-----------|--------------|--------|
| Usuario ya logueado abre link de invitacion | Ve el formulario de registro sin advertencia | Puede intentar registrarse con otro email, o confundirse |
| Custodio comparte su link de invitacion con alguien mas | La otra persona puede registrarse con el email de la invitacion | Bajo (email es read-only y debe coincidir) |
| Custodio abre link expirado | Muestra "Invitacion No Valida" con boton a login | Correcto |
| Custodio abre link sin token | Muestra "Link Invalido" | Correcto |

### Cambios propuestos

**Archivo: `src/pages/Auth/CustodianSignup.tsx`**

Agregar deteccion de sesion activa al inicio del componente:
- Si el usuario ya esta logueado, mostrar un mensaje: "Ya tienes una sesion activa. Cierra sesion primero si deseas registrar una nueva cuenta de custodio, o si ya eres custodio ve a tu portal."
- Ofrecer botones: "Cerrar sesion y continuar" (que hace signOut y recarga la pagina) e "Ir a mi portal" (navega a `/custodian`)

Esto previene que un admin o usuario existente abra el link de invitacion por error y se confunda.

**Archivo: `src/pages/Auth/CustodianSignup.tsx`**

Agregar validacion adicional en el formulario:
- Si el token es valido pero NO tiene email asociado (invitacion sin email), permitir que el usuario ingrese cualquier email (actualmente el campo no se bloquea si `prefillData.email` es null, lo cual es correcto)
- Agregar un indicador visual claro de que el registro es especificamente para custodios (ya existe el icono Shield, pero agregar un banner informativo)

**Archivo: `supabase/functions/create-custodian-account/index.ts`**

Agregar log adicional para debugging cuando la invitacion no matchea con el email del usuario existente en el rescue path. No se requieren cambios funcionales, la logica de rescate ya esta implementada en v3.0.0.

### Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Auth/CustodianSignup.tsx` | Deteccion de sesion activa + opciones de cierre de sesion o redireccion al portal |

### Resultado esperado

1. Los 6 custodios quedan corregidos con el SQL manual
2. El link de invitacion siempre lleva al flujo correcto:
   - Sin sesion activa: formulario de registro con email bloqueado
   - Con sesion activa: advertencia clara con opciones
   - Token invalido/expirado: mensaje claro con boton a login
   - Sin token: mensaje de error
3. La edge function v3.0.0 maneja usuarios existentes con `pending` automaticamente

