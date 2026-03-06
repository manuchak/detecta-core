

# Diagnostico: Workflow de Recuperacion de Contrasena Roto

## Problema encontrado

El edge function `send-password-reset` falla con error **403 de Resend**:

```
The detecta.app domain is not verified. Please, add and verify your domain on https://resend.com/domains
```

El dominio `detecta.app` no esta verificado en Resend, por lo que el email con el enlace de recuperacion **nunca llega** al usuario. El link se genera correctamente en Supabase, pero Resend rechaza el envio.

La funcion envia desde `notificaciones@detecta.app` (linea 76 del edge function).

## Solucion: 2 opciones

### Opcion A (rapida, recomendada): Usar `resetPasswordForEmail` nativo de Supabase
Elimina la dependencia de Resend completamente para password reset. Supabase envia el correo de recuperacion directamente via su servicio de emails integrado.

**Cambio en `ForgotPassword.tsx`**: Reemplazar la llamada a `supabase.functions.invoke("send-password-reset")` por:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
```

Esto funciona sin necesidad de dominio verificado en Resend — usa el email service nativo de Supabase.

### Opcion B: Verificar el dominio `detecta.app` en Resend
Requiere acceso a la cuenta de Resend y configuracion DNS del dominio. Proceso externo a Lovable.

## Plan de implementacion (Opcion A)

1. **Modificar `ForgotPassword.tsx`**: Reemplazar `supabase.functions.invoke` por `supabase.auth.resetPasswordForEmail` con `redirectTo` apuntando a `/reset-password`
2. **`ResetPassword.tsx`**: Ya funciona correctamente — detecta el hash `type=recovery` y permite `updateUser({ password })`
3. **El edge function `send-password-reset` queda obsoleto** pero no se elimina (por si se quiere reactivar con dominio verificado)

Un solo archivo modificado, ~5 lineas cambiadas. El usuario podra recuperar su contrasena inmediatamente.

