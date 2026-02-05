
# Plan: Soluciones para Manejar 50+ Registros de Custodios sin Resend

## Opciones Disponibles

| Opción | Complejidad | Tiempo | Requiere Verificación |
|--------|-------------|--------|----------------------|
| **A) Auto-confirmar usuarios** | Baja | 5 min | No |
| **B) SMTP personalizado (SendGrid/AWS SES)** | Media | 30 min | Sí (dominio) |
| **C) Deshabilitar confirmación global** | Baja | 2 min | No |

---

## Opción A: Auto-confirmar Usuarios (RECOMENDADA)

### Ventajas
- **Sin verificación de dominio**: No necesitas Resend ni otro servicio
- **Acceso inmediato**: Custodios pueden entrar al instante
- **Seguridad mantenida**: El token de invitación ya valida que fueron invitados
- **Sin rate limits**: Usa la Admin API que no tiene límites

### Cómo Funciona

```text
FLUJO ACTUAL (bloqueado por Resend):
┌─────────┐     ┌──────────────┐     ┌────────┐     ┌─────────────┐
│ Signup  │────▶│ createUser() │────▶│ Resend │────▶│ Email conf. │
│ Form    │     │ confirm:false│     │ ❌FALLA│     │ (no llega)  │
└─────────┘     └──────────────┘     └────────┘     └─────────────┘

FLUJO PROPUESTO (sin dependencias):
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌───────────┐
│ Signup  │────▶│ createUser() │────▶│ Asignar rol │────▶│ Onboarding│
│ Form    │     │ confirm:TRUE │     │ de custodio │     │ directo   │
└─────────┘     └──────────────┘     └─────────────┘     └───────────┘
```

### Cambios Requeridos

**Archivo 1: `supabase/functions/create-custodian-account/index.ts`**

1. Cambiar `email_confirm: false` → `email_confirm: true` (auto-confirma el email)
2. Después de crear el usuario, marcar la invitación como usada
3. Asignar el rol de custodio directamente
4. Retornar sesión para login automático

```typescript
// Crear usuario AUTO-CONFIRMADO
const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // ✅ Auto-confirmar
  user_metadata: { display_name: nombre, invitation_token: invitationToken }
});

// Marcar invitación como usada
await supabaseAdmin
  .from('custodian_invitations')
  .update({ used_at: new Date().toISOString(), used_by: userData.user.id })
  .eq('token', invitationToken);

// Asignar rol de custodio
await supabaseAdmin
  .from('user_profiles')
  .upsert({
    id: userData.user.id,
    email: email,
    display_name: nombre,
    role: 'custodio',
    telefono: telefono
  });

// Generar sesión para login automático
const { data: sessionData } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email,
});

return { success: true, user: userData.user, autoLogin: true };
```

**Archivo 2: `src/pages/Auth/CustodianSignup.tsx`**

Modificar para manejar el login automático:

```typescript
if (data?.success && data?.autoLogin) {
  // Iniciar sesión automáticamente
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (!signInError) {
    navigate('/custodian/onboarding');
    return;
  }
}
```

### Flujo de Usuario Final

1. Custodio abre link de invitación
2. Llena formulario (nombre, email, contraseña)
3. Click "Crear cuenta"
4. **Inmediatamente** es redirigido al onboarding de documentos
5. No necesita revisar email ni confirmar nada

---

## Opción B: SMTP Personalizado (SendGrid/AWS SES)

Si prefieres mantener la confirmación por email, puedes configurar un SMTP en Supabase.

### Pasos
1. Crear cuenta en SendGrid (gratis hasta 100 emails/día) o AWS SES
2. Verificar dominio `detecta.app` en el proveedor elegido
3. Obtener credenciales SMTP
4. Configurar en Supabase Dashboard → Settings → Auth → SMTP

### Credenciales Requeridas
- **Host**: `smtp.sendgrid.net` o similar
- **Port**: 587
- **Username**: `apikey` (SendGrid) o tu usuario
- **Password**: Tu API key
- **Sender email**: `notificaciones@detecta.app`

### Limitación
- SendGrid también requiere verificar el dominio
- El proceso es similar a Resend

---

## Opción C: Deshabilitar Confirmación Globalmente

### Pasos
1. Ir a Supabase Dashboard → Authentication → Sign In / Providers
2. En la sección "Email", desactivar "Confirm email"
3. Guardar

### Implicaciones
- **Todos** los usuarios (no solo custodios) podrán registrarse sin confirmar email
- Menor seguridad para otros flujos de registro
- No recomendado si tienes otros tipos de usuarios

---

## Recomendación Final

**Opción A (Auto-confirmar)** es la mejor porque:

| Criterio | Auto-confirmar | SMTP | Deshabilitar global |
|----------|----------------|------|---------------------|
| Sin dependencias externas | ✅ | ❌ | ✅ |
| Seguridad (invitación requerida) | ✅ | ✅ | ⚠️ |
| Experiencia de usuario | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Tiempo de implementación | 5 min | 30+ min | 2 min |
| Escalabilidad (50+ custodios) | ✅ | ✅ | ✅ |

El token de invitación ya actúa como verificación de que el custodio fue aprobado por un administrador, así que la confirmación de email es redundante en este flujo.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/create-custodian-account/index.ts` | Auto-confirmar + asignar rol + login automático |
| `src/pages/Auth/CustodianSignup.tsx` | Manejar respuesta de login automático |

## Resultado Esperado

- 50+ custodios pueden registrarse sin problemas
- Acceso inmediato al portal sin esperar emails
- Sin dependencia de servicios externos de email
- Seguridad mantenida via tokens de invitación
